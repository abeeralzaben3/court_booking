
<?php

class Auth
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function register(
        string $fullName,
        string $email,
        ?string $phone,
        string $password
    ): bool {
        // Check if email already exists
        $stmt = $this->pdo->prepare(
            "SELECT id FROM users WHERE email = ?"
        );

        $stmt->execute([$email]);

        if ($stmt->fetch()) {
            throw new Exception("Email already registered");
        }

        // Hash password before saving
        $hashedPassword = password_hash(
            $password,
            PASSWORD_DEFAULT
        );

        // Insert new player
        $stmt = $this->pdo->prepare(
            "INSERT INTO users
            (full_name, email, phone, password, role)
            VALUES (?, ?, ?, ?, 'player')"
        );

        return $stmt->execute([
            $fullName,
            $email,
            $phone,
            $hashedPassword
        ]);
    }
}
