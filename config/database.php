<?php

return [
    "default" => env("DB_CONNECTION", "sqlite"),

    "connections" => [
        "sqlite" => [
            "driver" => "sqlite",
            "url" => env("DATABASE_URL"),
            "database" => env("DB_DATABASE", database_path("database.sqlite")),
            "prefix" => "",
            "foreign_key_constraints" => env("DB_FOREIGN_KEYS", true),
        ],
        "mysql" => [
            "driver" => "mysql",
            "host" => env("DB_HOST", "127.0.0.1"),
            "port" => env("DB_PORT", "3306"),
            "database" => env("DB_DATABASE", "TDMU_CongDoan_DB"),
            "username" => env("DB_USERNAME", "root"),
            "password" => env("DB_PASSWORD", ""),
            "charset" => "utf8mb4",
            "collation" => "utf8mb4_unicode_ci",
            "prefix" => "",
            "strict" => false,
            "engine" => null,
        ],
        "sqlsrv" => [
            "driver" => "sqlsrv",
            "host" => env("DB_HOST", "RTX-ON\\MSSQLVESE"),
            "port" => env("DB_PORT", "1433"),
            "database" => env("DB_DATABASE", "TDMU_CongDoan_DB"),
            "username" => env("DB_USERNAME", "sa"),
            "password" => env("DB_PASSWORD", "123456"),
            "charset" => "utf8",
            "prefix" => "",
            "prefix_indexes" => true,
            "encrypt" => env("DB_ENCRYPT", "no"),
            "trust_server_certificate" => env("DB_TRUST_SERVER_CERTIFICATE", "true"),
        ],
    ],
    "migrations" => "migrations",
];