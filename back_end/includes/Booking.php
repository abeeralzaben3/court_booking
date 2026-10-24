
<?php

class Booking
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Check whether a confirmed booking overlaps the requested time
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

        $timezone = new DateTimeZone('Asia/Amman');

        // Validate date
        $bookingDate = DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $date,
            $timezone
        );

        if (
            !$bookingDate ||
            $bookingDate->format('Y-m-d') !== $date
        ) {
            throw new InvalidArgumentException(
                'Invalid booking date'
            );
        }

        // Validate times
        $start = DateTimeImmutable::createFromFormat(
            '!H:i',
            $startTime,
            $timezone
        );

        $end = DateTimeImmutable::createFromFormat(
            '!H:i',
            $endTime,
            $timezone
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

        $bookingStart = new DateTimeImmutable(
            $date . ' ' . $startTime,
            $timezone
        );

        $now = new DateTimeImmutable('now', $timezone);

        if ($bookingStart <= $now) {
            throw new InvalidArgumentException(
                'Cannot book a time in the past'
            );
        }

        $durationSeconds =
            $end->getTimestamp() - $start->getTimestamp();

        $hours = $durationSeconds / 3600;

        try {
            $this->pdo->beginTransaction();

            // Lock court to prevent concurrent double bookings
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

            if ($this->hasConflict(
                $courtId,
                $date,
                $startTime,
                $endTime
            )) {
                throw new InvalidArgumentException(
                    'Court is already booked at this time'
                );
            }

            $totalPrice = round(
                (float) $court['price_per_hour'] * $hours,
                2
            );

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

    // Get all bookings belonging to a user
    public function getUserBookings(int $userId): array
    {
        if ($userId <= 0) {
            throw new InvalidArgumentException(
                'Invalid user ID'
            );
        }

        $stmt = $this->pdo->prepare(
            "SELECT
                b.id,
                b.court_id,
                c.name AS court_name,
                c.sport,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.total_price,
                b.status,
                b.created_at,
                p.method AS payment_method,
                p.status AS payment_status
             FROM bookings b
             INNER JOIN courts c
                ON b.court_id = c.id
             LEFT JOIN payments p
                ON p.booking_id = b.id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC,
                      b.start_time DESC"
        );

        $stmt->execute([$userId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get confirmed booked time slots for a court on a date
    public function getBookedSlots(
        int $courtId,
        string $date
    ): array {
        if ($courtId <= 0) {
            throw new InvalidArgumentException(
                'Invalid court ID'
            );
        }

        $timezone = new DateTimeZone('Asia/Amman');

        $bookingDate = DateTimeImmutable::createFromFormat(
            '!Y-m-d',
            $date,
            $timezone
        );

        if (
            !$bookingDate ||
            $bookingDate->format('Y-m-d') !== $date
        ) {
            throw new InvalidArgumentException(
                'Invalid booking date'
            );
        }

        $stmt = $this->pdo->prepare(
            "SELECT start_time, end_time
             FROM bookings
             WHERE court_id = ?
               AND booking_date = ?
               AND status = 'confirmed'
             ORDER BY start_time ASC"
        );

        $stmt->execute([$courtId, $date]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Cancel a booking belonging to the logged-in user
    public function cancelBooking(
        int $bookingId,
        int $userId
    ): bool {
        if ($bookingId <= 0 || $userId <= 0) {
            throw new InvalidArgumentException(
                'Invalid booking or user ID'
            );
        }

        $timezone = new DateTimeZone('Asia/Amman');

        try {
            $this->pdo->beginTransaction();

            $stmt = $this->pdo->prepare(
                "SELECT
                    id,
                    user_id,
                    booking_date,
                    start_time,
                    status
                 FROM bookings
                 WHERE id = ?
                 FOR UPDATE"
            );

            $stmt->execute([$bookingId]);

            $booking = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                throw new InvalidArgumentException(
                    'Booking not found'
                );
            }

            if ((int) $booking['user_id'] !== $userId) {
                throw new InvalidArgumentException(
                    'You cannot cancel this booking'
                );
            }

            if ($booking['status'] !== 'confirmed') {
                throw new InvalidArgumentException(
                    'Only confirmed bookings can be cancelled'
                );
            }

            $bookingStart = new DateTimeImmutable(
                $booking['booking_date'] . ' ' .
                $booking['start_time'],
                $timezone
            );

            $now = new DateTimeImmutable('now', $timezone);

            if ($bookingStart <= $now) {
                throw new InvalidArgumentException(
                    'Cannot cancel a booking that has started'
                );
            }

            // Lock any associated payment
            $stmt = $this->pdo->prepare(
                "SELECT id, status
                 FROM payments
                 WHERE booking_id = ?
                 FOR UPDATE"
            );

            $stmt->execute([$bookingId]);

            $payment = $stmt->fetch(PDO::FETCH_ASSOC);

            // Paid bookings require a separate refund process
            if ($payment && $payment['status'] === 'paid') {
                throw new InvalidArgumentException(
                    'Paid booking requires refund handling'
                );
            }

            $stmt = $this->pdo->prepare(
                "UPDATE bookings
                 SET status = 'cancelled'
                 WHERE id = ?"
            );

            $stmt->execute([$bookingId]);

            $this->pdo->commit();

            return true;

        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $e;
        }
    }
}
