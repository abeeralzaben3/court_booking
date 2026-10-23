
<?php

class Court
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

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
}
