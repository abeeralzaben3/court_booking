
<?php

class Payment
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Create a payment record for a booking
    public function createPayment(
        int $bookingId,
        int $userId,
        string $method
    ): int {
        if ($bookingId <= 0 || $userId <= 0) {
            throw new InvalidArgumentException(
                'Invalid booking or user ID'
            );
        }

        if (!in_array($method, ['cash', 'card'], true)) {
            throw new InvalidArgumentException(
                'Invalid payment method'
            );
        }

        try {
            $this->pdo->beginTransaction();

            // Lock the booking while creating its payment
            $stmt = $this->pdo->prepare(
                "SELECT id, user_id, total_price, status
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

            // Only the booking owner can pay
            if ((int) $booking['user_id'] !== $userId) {
                throw new InvalidArgumentException(
                    'You cannot pay for this booking'
                );
            }

            if ($booking['status'] !== 'confirmed') {
                throw new InvalidArgumentException(
                    'Booking is not eligible for payment'
                );
            }

            // Prevent duplicate payments
            $stmt = $this->pdo->prepare(
                "SELECT id
                 FROM payments
                 WHERE booking_id = ?"
            );

            $stmt->execute([$bookingId]);

            if ($stmt->fetch()) {
                throw new InvalidArgumentException(
                    'Payment already exists for this booking'
                );
            }

            // Cash and card payments start as pending
            // until payment is actually confirmed
            $stmt = $this->pdo->prepare(
                "INSERT INTO payments
                 (booking_id, amount, method, status)
                 VALUES (?, ?, ?, 'pending')"
            );

            $stmt->execute([
                $bookingId,
                $booking['total_price'],
                $method
            ]);

            $paymentId = (int) $this->pdo->lastInsertId();

            $this->pdo->commit();

            return $paymentId;

        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }

            throw $e;
        }
    }

    // Get payment details by booking ID
    public function getPaymentByBookingId(
        int $bookingId,
        int $userId
    ): array|false {
        $stmt = $this->pdo->prepare(
            "SELECT
                p.id,
                p.booking_id,
                p.amount,
                p.method,
                p.status,
                p.paid_at
             FROM payments p
             INNER JOIN bookings b
                 ON p.booking_id = b.id
             WHERE p.booking_id = ?
               AND b.user_id = ?"
        );

        $stmt->execute([
            $bookingId,
            $userId
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
