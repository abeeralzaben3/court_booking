
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

            // Lock booking to prevent concurrent payment changes
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

            // Prevent duplicate payment records
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

            // Both methods begin as pending
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

    // Get payment details for the booking owner
    public function getPaymentByBookingId(
        int $bookingId,
        int $userId
    ): array|false {
        if ($bookingId <= 0 || $userId <= 0) {
            throw new InvalidArgumentException(
                'Invalid booking or user ID'
            );
        }

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

    // Confirm actual receipt of a cash payment
    // Must only be called by an admin-protected endpoint
    public function confirmCashPayment(int $bookingId): bool
    {
        if ($bookingId <= 0) {
            throw new InvalidArgumentException(
                'Invalid booking ID'
            );
        }

        try {
            $this->pdo->beginTransaction();

            // Lock booking first, matching createPayment lock order
            $stmt = $this->pdo->prepare(
                "SELECT id, status
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

            if ($booking['status'] !== 'confirmed') {
                throw new InvalidArgumentException(
                    'Cannot confirm payment for this booking'
                );
            }

            // Lock payment before changing its status
            $stmt = $this->pdo->prepare(
                "SELECT id, method, status
                 FROM payments
                 WHERE booking_id = ?
                 FOR UPDATE"
            );

            $stmt->execute([$bookingId]);

            $payment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$payment) {
                throw new InvalidArgumentException(
                    'Payment not found'
                );
            }

            if ($payment['method'] !== 'cash') {
                throw new InvalidArgumentException(
                    'Only cash payments can be confirmed here'
                );
            }

            if ($payment['status'] !== 'pending') {
                throw new InvalidArgumentException(
                    'Payment is not pending'
                );
            }

            $stmt = $this->pdo->prepare(
                "UPDATE payments
                 SET status = 'paid',
                     paid_at = NOW()
                 WHERE id = ?
                   AND status = 'pending'"
            );

            $stmt->execute([$payment['id']]);

            if ($stmt->rowCount() !== 1) {
                throw new RuntimeException(
                    'Payment confirmation failed'
                );
            }

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
