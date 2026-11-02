package com.mokeep.app.data.local

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.mokeep.app.data.model.*

class MokeepDatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "mokeep_local.db"
        const val DATABASE_VERSION = 1

        // Tables
        const val TABLE_ACCOUNTS = "accounts"
        const val TABLE_CATEGORIES = "categories"
        const val TABLE_TRANSACTIONS = "transactions"
        const val TABLE_BUDGETS = "budgets"
        const val TABLE_GOALS = "goals"
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE $TABLE_ACCOUNTS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                initial_balance REAL NOT NULL DEFAULT 0.0,
                current_balance REAL NOT NULL DEFAULT 0.0,
                account_number TEXT,
                color INTEGER NOT NULL,
                icon_name TEXT NOT NULL,
                is_archived INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE $TABLE_CATEGORIES (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                icon_name TEXT NOT NULL,
                color INTEGER NOT NULL
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE $TABLE_TRANSACTIONS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                date_millis INTEGER NOT NULL,
                account_id INTEGER NOT NULL,
                to_account_id INTEGER,
                category_id INTEGER,
                note TEXT
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE $TABLE_BUDGETS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL
            )
        """.trimIndent())

        db.execSQL("""
            CREATE TABLE $TABLE_GOALS (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                target_amount REAL NOT NULL,
                current_amount REAL NOT NULL DEFAULT 0.0,
                deadline_millis INTEGER NOT NULL,
                target_account_id INTEGER
            )
        """.trimIndent())

        // Seed default initial categories & accounts for offline Indonesia users
        seedInitialData(db)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Migration strategy
    }

    private fun seedInitialData(db: SQLiteDatabase) {
        // Default Accounts (Dompet / Pocket)
        val initialAccounts = listOf(
            Account(name = "Dompet Utama (Kas)", type = AccountType.CASH, initialBalance = 250000.0, currentBalance = 250000.0, color = 0xFF10B981, iconName = "Wallet"),
            Account(name = "BCA Tabungan", type = AccountType.BANK, initialBalance = 2500000.0, currentBalance = 2500000.0, accountNumber = "1234567890", color = 0xFF3B82F6, iconName = "Landmark"),
            Account(name = "GoPay", type = AccountType.EWALLET, initialBalance = 150000.0, currentBalance = 150000.0, color = 0xFF0EA5E9, iconName = "Smartphone")
        )

        for (acc in initialAccounts) {
            val cv = ContentValues().apply {
                put("name", acc.name)
                put("type", acc.type.name)
                put("initial_balance", acc.initialBalance)
                put("current_balance", acc.currentBalance)
                put("account_number", acc.accountNumber)
                put("color", acc.color)
                put("icon_name", acc.iconName)
                put("is_archived", 0)
            }
            db.insert(TABLE_ACCOUNTS, null, cv)
        }

        // Default Categories
        val initialCategories = listOf(
            // Expense
            Category(name = "Makanan & Minuman", type = TransactionType.EXPENSE, iconName = "Utensils", color = 0xFFEF4444),
            Category(name = "Transportasi", type = TransactionType.EXPENSE, iconName = "Car", color = 0xFFF97316),
            Category(name = "Belanja Kebutuhan", type = TransactionType.EXPENSE, iconName = "ShoppingBag", color = 0xFF8B5CF6),
            Category(name = "Tagihan & Pulsa", type = TransactionType.EXPENSE, iconName = "Receipt", color = 0xFFEC4899),
            Category(name = "Hiburan & Liburan", type = TransactionType.EXPENSE, iconName = "Film", color = 0xFFF59E0B),
            // Income
            Category(name = "Gaji Pokok", type = TransactionType.INCOME, iconName = "Briefcase", color = 0xFF10B981),
            Category(name = "Freelance & Usaha", type = TransactionType.INCOME, iconName = "Laptop", color = 0xFF06B6D4),
            Category(name = "Hadiah & Bonus", type = TransactionType.INCOME, iconName = "Gift", color = 0xFF14B8A6)
        )

        for (cat in initialCategories) {
            val cv = ContentValues().apply {
                put("name", cat.name)
                put("type", cat.type.name)
                put("icon_name", cat.iconName)
                put("color", cat.color)
            }
            db.insert(TABLE_CATEGORIES, null, cv)
        }
    }
}
