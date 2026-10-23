
<?php

class Booking
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Check whether the requested time overlaps an existing booking
    public function hasConflict(
        int $courtId,
        string $date,
        string $startTime,
        string $endTime
    ): bool {
        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*)
             FROM bookings
             WHERE court_id = ?
               AND booking_date = ?
               AND status = 'confirmed'
               AND start_time < ?
               AND end_time > ?"
        );

        $stmt->execute([
            $courtId,
            $date,
            $endTime,
            $startTime
        ]);

        return (int) $stmt->fetchColumn() > 0;
    }

    // Create a new booking
    public function createBooking(
        int $userId,
        int $courtId,
        string $date,
        string $startTime,
        string $endTime
    ): int {
        if ($userId <= 0 || $courtId <= 0) {
            throw new InvalidArgumentException(
                'Invalid user or court ID'
            );
        }

        // Validate date format
        $bookingDate = DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $date
        );

        if (
            !$bookingDate ||
            $bookingDate->format('Y-m-d') !== $date
        ) {
            throw new InvalidArgumentException(
                'Invalid booking date'
            );
        }

        // Validate time format
        $start = DateTimeImmutable::createFromFormat(
            '!H:i',
            $startTime
        );

        $end = DateTimeImmutable::createFromFormat(
            '!H:i',
            $endTime
        );

        if (
            !$start ||
            !$end ||
            $start->format('H:i') !== $startTime ||
            $end->format('H:i') !== $endTime
        ) {
            throw new InvalidArgumentException(
                'Invalid booking time'
            );
        }

        if ($end <= $start) {
            throw new InvalidArgumentException(
                'End time must be after start time'
            );
        }

        // Use the application's configured timezone
        $now = new DateTimeImmutable();

        $bookingStart = new DateTimeImmutable(
            $date . ' ' . $startTime
        );

        if ($bookingStart <= $now) {
            throw new InvalidArgumentException(
                'Cannot book a time in the past'
            );
        }

        // Calculate booking duration in hours
        $durationSeconds =
            $end->getTimestamp() - $start->getTimestamp();

        $hours = $durationSeconds / 3600;

        try {
            $this->pdo->beginTransaction();

            // Lock the court row to serialize bookings
            // for the same court
            $stmt = $this->pdo->prepare(
                "SELECT id, price_per_hour, status
                 FROM courts
                 WHERE id = ?
                 FOR UPDATE"
            );

            $stmt->execute([$courtId]);

            $court = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$court) {
                throw new InvalidArgumentException(
                    'Court not found'
                );
            }

            if ($court['status'] !== 'active') {
                throw new InvalidArgumentException(
                    'Court is not available'
                );
            }

            // Check for overlapping confirmed bookings
            if (
                $this->hasConflict(
                    $courtId,
                    $date,
                    $startTime,
                    $endTime
                )
            ) {
                throw new InvalidArgumentException(
                    'Court is already booked at this time'
                );
            }

            // Calculate total price
            $totalPrice = round(
                (float) $court['price_per_hour'] * $hours,
                2
            );

            // Insert booking
            $stmt = $this->pdo->prepare(
                "INSERT INTO bookings
                 (
                     user_id,
                     court_id,
                     booking_date,
                     start_time,
                     end_time,
                     total_price,
                     status
                 )
                 VALUES (?, ?, ?, ?, ?, ?, 'confirmed')"
            );

            $stmt->execute([
                $userId,
                $courtId,
                $date,
                $startTime,
                $endTime,
                $totalPrice
            ]);

            $bookingId = (int) $this->pdo->lastInsertId();

            $this->pdo->commit();

            return $bookingId;

        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $e;
        }
    }
}
