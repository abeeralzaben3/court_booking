
<?php

class Court
{
    private PDO $pdo;

    private const ALLOWED_SPORTS = [
        'tennis',
        'badminton',
        'basketball'
    ];

    private const ALLOWED_STATUSES = [
        'active',
        'maintenance'
    ];

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    // Get all courts
    public function getAllCourts(): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT id, name, sport, price_per_hour, status
             FROM courts
             ORDER BY id ASC"
        );

        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Get one court by ID
    public function getCourtById(int $courtId): array|false
    {
        if ($courtId <= 0) {
            throw new InvalidArgumentException(
                'Invalid court ID'
            );
        }

        $stmt = $this->pdo->prepare(
            "SELECT id, name, sport, price_per_hour, status
             FROM courts
             WHERE id = ?"
        );

        $stmt->execute([$courtId]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Create a new court
    public function createCourt(
        string $name,
        string $sport,
        float $pricePerHour,
        string $status = 'active'
    ): int {
        $this->validateCourtData(
            $name,
            $sport,
            $pricePerHour,
            $status
        );

        $stmt = $this->pdo->prepare(
            "INSERT INTO courts
             (name, sport, price_per_hour, status)
             VALUES (?, ?, ?, ?)"
        );

        $stmt->execute([
            trim($name),
            $sport,
            $pricePerHour,
            $status
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    // Update court details
    public function updateCourt(
        int $courtId,
        string $name,
        string $sport,
        float $pricePerHour,
        string $status
    ): bool {
        if ($courtId <= 0) {
            throw new InvalidArgumentException(
                'Invalid court ID'
            );
        }

        $this->validateCourtData(
            $name,
            $sport,
            $pricePerHour,
            $status
        );

        if (!$this->getCourtById($courtId)) {
            throw new InvalidArgumentException(
                'Court not found'
            );
        }

        $stmt = $this->pdo->prepare(
            "UPDATE courts
             SET name = ?,
                 sport = ?,
                 price_per_hour = ?,
                 status = ?
             WHERE id = ?"
        );

        return $stmt->execute([
            trim($name),
            $sport,
            $pricePerHour,
            $status,
            $courtId
        ]);
    }

    // Change court status only
    public function updateCourtStatus(
        int $courtId,
        string $status
    ): bool {
        if ($courtId <= 0) {
            throw new InvalidArgumentException(
                'Invalid court ID'
            );
        }

        if (!in_array(
            $status,
            self::ALLOWED_STATUSES,
            true
        )) {
            throw new InvalidArgumentException(
                'Invalid court status'
            );
        }

        if (!$this->getCourtById($courtId)) {
            throw new InvalidArgumentException(
                'Court not found'
            );
        }

        $stmt = $this->pdo->prepare(
            "UPDATE courts
             SET status = ?
             WHERE id = ?"
        );

        return $stmt->execute([
            $status,
            $courtId
        ]);
    }

    // Validate court details
    private function validateCourtData(
        string $name,
        string $sport,
        float $pricePerHour,
        string $status
    ): void {
        $name = trim($name);

        if ($name === '' || mb_strlen($name) > 255) {
            throw new InvalidArgumentException(
                'Court name must be between 1 and 255 characters'
            );
        }

        if (!in_array(
            $sport,
            self::ALLOWED_SPORTS,
            true
        )) {
            throw new InvalidArgumentException(
                'Invalid sport type'
            );
        }

        if (
            !is_finite($pricePerHour) ||
            $pricePerHour <= 0 ||
            $pricePerHour > 999999.99 ||
            round($pricePerHour, 2) != $pricePerHour
        ) {
            throw new InvalidArgumentException(
                'Invalid price per hour'
            );
        }

        if (!in_array(
            $status,
            self::ALLOWED_STATUSES,
            true
        )) {
            throw new InvalidArgumentException(
                'Invalid court status'
            );
        }
    }
}
