package com.mokeep.app.data.model

data class UserProfile(
    val name: String = "Hayqal Pratama",
    val email: String = "user@mokeep.id",
    val currency: String = "IDR"
)

enum class AccountType(val label: String) {
    CASH("Kas / Tunai / Pocket"),
    EWALLET("E-Wallet"),
    BANK("Rekening Bank"),
    CREDIT_CARD("Kartu Kredit"),
    INVESTMENT("Investasi")
}

data class Account(
    val id: Long = 0,
    val name: String,
    val type: AccountType,
    val initialBalance: Double = 0.0,
    val currentBalance: Double = 0.0,
    val accountNumber: String? = null,
    val color: Long = 0xFF10B981,
    val iconName: String = "Wallet",
    val isArchived: Boolean = false
)

enum class TransactionType(val label: String) {
    INCOME("Pemasukan"),
    EXPENSE("Pengeluaran"),
    TRANSFER("Transfer")
}

data class Category(
    val id: Long = 0,
    val name: String,
    val type: TransactionType,
    val iconName: String = "Tag",
    val color: Long = 0xFF10B981
)

data class TransactionItem(
    val id: Long = 0,
    val type: TransactionType,
    val amount: Double,
    val dateMillis: Long,
    val accountId: Long,
    val toAccountId: Long? = null,
    val categoryId: Long? = null,
    val note: String? = null
)

data class Budget(
    val id: Long = 0,
    val categoryId: Long,
    val amount: Double,
    val month: Int, // 1 - 12
    val year: Int
)

data class Goal(
    val id: Long = 0,
    val name: String,
    val targetAmount: Double,
    val currentAmount: Double = 0.0,
    val deadlineMillis: Long,
    val targetAccountId: Long? = null
)
