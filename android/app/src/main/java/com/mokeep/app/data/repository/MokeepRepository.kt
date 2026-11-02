package com.mokeep.app.data.repository

import android.content.ContentValues
import android.content.Context
import com.mokeep.app.data.local.MokeepDatabaseHelper
import com.mokeep.app.data.model.*
import java.text.NumberFormat
import java.util.*

class MokeepRepository(context: Context) {
    private val dbHelper = MokeepDatabaseHelper(context)

    // Helper currency formatter Rupiah
    companion object {
        fun formatRupiah(amount: Double): String {
            val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
            format.maximumFractionDigits = 0
            return format.format(amount).replace("Rp", "Rp ")
        }
    }

    // ----------------- ACCOUNTS -----------------
    fun getAccounts(): List<Account> {
        val list = mutableListOf<Account>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(MokeepDatabaseHelper.TABLE_ACCOUNTS, null, "is_archived = 0", null, null, null, "id ASC")
        while (cursor.moveToNext()) {
            list.add(
                Account(
                    id = cursor.getLong(cursor.getColumnIndexOrThrow("id")),
                    name = cursor.getString(cursor.getColumnIndexOrThrow("name")),
                    type = AccountType.valueOf(cursor.getString(cursor.getColumnIndexOrThrow("type"))),
                    initialBalance = cursor.getDouble(cursor.getColumnIndexOrThrow("initial_balance")),
                    currentBalance = cursor.getDouble(cursor.getColumnIndexOrThrow("current_balance")),
                    accountNumber = cursor.getString(cursor.getColumnIndexOrThrow("account_number")),
                    color = cursor.getLong(cursor.getColumnIndexOrThrow("color")),
                    iconName = cursor.getString(cursor.getColumnIndexOrThrow("icon_name")),
                    isArchived = cursor.getInt(cursor.getColumnIndexOrThrow("is_archived")) == 1
                )
            )
        }
        cursor.close()
        return list
    }

    fun addAccount(account: Account): Long {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("name", account.name)
            put("type", account.type.name)
            put("initial_balance", account.initialBalance)
            put("current_balance", account.initialBalance)
            put("account_number", account.accountNumber)
            put("color", account.color)
            put("icon_name", account.iconName)
            put("is_archived", 0)
        }
        return db.insert(MokeepDatabaseHelper.TABLE_ACCOUNTS, null, cv)
    }

    fun updateAccount(account: Account) {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("name", account.name)
            put("type", account.type.name)
            put("account_number", account.accountNumber)
            put("color", account.color)
            put("icon_name", account.iconName)
        }
        db.update(MokeepDatabaseHelper.TABLE_ACCOUNTS, cv, "id = ?", arrayOf(account.id.toString()))
    }

    fun deleteAccount(accountId: Long) {
        val db = dbHelper.writableDatabase
        db.delete(MokeepDatabaseHelper.TABLE_ACCOUNTS, "id = ?", arrayOf(accountId.toString()))
    }

    // ----------------- CATEGORIES -----------------
    fun getCategories(): List<Category> {
        val list = mutableListOf<Category>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(MokeepDatabaseHelper.TABLE_CATEGORIES, null, null, null, null, null, "id ASC")
        while (cursor.moveToNext()) {
            list.add(
                Category(
                    id = cursor.getLong(cursor.getColumnIndexOrThrow("id")),
                    name = cursor.getString(cursor.getColumnIndexOrThrow("name")),
                    type = TransactionType.valueOf(cursor.getString(cursor.getColumnIndexOrThrow("type"))),
                    iconName = cursor.getString(cursor.getColumnIndexOrThrow("icon_name")),
                    color = cursor.getLong(cursor.getColumnIndexOrThrow("color"))
                )
            )
        }
        cursor.close()
        return list
    }

    fun addCategory(category: Category): Long {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("name", category.name)
            put("type", category.type.name)
            put("icon_name", category.iconName)
            put("color", category.color)
        }
        return db.insert(MokeepDatabaseHelper.TABLE_CATEGORIES, null, cv)
    }

    fun deleteCategory(categoryId: Long) {
        val db = dbHelper.writableDatabase
        db.delete(MokeepDatabaseHelper.TABLE_CATEGORIES, "id = ?", arrayOf(categoryId.toString()))
    }

    // ----------------- TRANSACTIONS -----------------
    fun getTransactions(): List<TransactionItem> {
        val list = mutableListOf<TransactionItem>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(MokeepDatabaseHelper.TABLE_TRANSACTIONS, null, null, null, null, null, "date_millis DESC")
        while (cursor.moveToNext()) {
            val toAccIndex = cursor.getColumnIndexOrThrow("to_account_id")
            val catIndex = cursor.getColumnIndexOrThrow("category_id")
            val noteIndex = cursor.getColumnIndexOrThrow("note")
            list.add(
                TransactionItem(
                    id = cursor.getLong(cursor.getColumnIndexOrThrow("id")),
                    type = TransactionType.valueOf(cursor.getString(cursor.getColumnIndexOrThrow("type"))),
                    amount = cursor.getDouble(cursor.getColumnIndexOrThrow("amount")),
                    dateMillis = cursor.getLong(cursor.getColumnIndexOrThrow("date_millis")),
                    accountId = cursor.getLong(cursor.getColumnIndexOrThrow("account_id")),
                    toAccountId = if (cursor.isNull(toAccIndex)) null else cursor.getLong(toAccIndex),
                    categoryId = if (cursor.isNull(catIndex)) null else cursor.getLong(catIndex),
                    note = if (cursor.isNull(noteIndex)) null else cursor.getString(noteIndex)
                )
            )
        }
        cursor.close()
        return list
    }

    fun addTransaction(tx: TransactionItem): Boolean {
        val db = dbHelper.writableDatabase
        db.beginTransaction()
        try {
            val cv = ContentValues().apply {
                put("type", tx.type.name)
                put("amount", tx.amount)
                put("date_millis", tx.dateMillis)
                put("account_id", tx.accountId)
                put("to_account_id", tx.toAccountId)
                put("category_id", tx.categoryId)
                put("note", tx.note)
            }
            db.insert(MokeepDatabaseHelper.TABLE_TRANSACTIONS, null, cv)

            // Atomic balance update
            when (tx.type) {
                TransactionType.INCOME -> {
                    db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance + ${tx.amount} WHERE id = ${tx.accountId}")
                }
                TransactionType.EXPENSE -> {
                    db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance - ${tx.amount} WHERE id = ${tx.accountId}")
                }
                TransactionType.TRANSFER -> {
                    if (tx.toAccountId != null) {
                        db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance - ${tx.amount} WHERE id = ${tx.accountId}")
                        db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance + ${tx.amount} WHERE id = ${tx.toAccountId}")
                    }
                }
            }
            db.setTransactionSuccessful()
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        } finally {
            db.endTransaction()
        }
    }

    fun deleteTransaction(tx: TransactionItem): Boolean {
        val db = dbHelper.writableDatabase
        db.beginTransaction()
        try {
            db.delete(MokeepDatabaseHelper.TABLE_TRANSACTIONS, "id = ?", arrayOf(tx.id.toString()))
            // Rollback balance
            when (tx.type) {
                TransactionType.INCOME -> {
                    db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance - ${tx.amount} WHERE id = ${tx.accountId}")
                }
                TransactionType.EXPENSE -> {
                    db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance + ${tx.amount} WHERE id = ${tx.accountId}")
                }
                TransactionType.TRANSFER -> {
                    if (tx.toAccountId != null) {
                        db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance + ${tx.amount} WHERE id = ${tx.accountId}")
                        db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_ACCOUNTS} SET current_balance = current_balance - ${tx.amount} WHERE id = ${tx.toAccountId}")
                    }
                }
            }
            db.setTransactionSuccessful()
            return true
        } catch (e: Exception) {
            e.printStackTrace()
            return false
        } finally {
            db.endTransaction()
        }
    }

    // ----------------- BUDGETS -----------------
    fun getBudgets(): List<Budget> {
        val list = mutableListOf<Budget>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(MokeepDatabaseHelper.TABLE_BUDGETS, null, null, null, null, null, "id DESC")
        while (cursor.moveToNext()) {
            list.add(
                Budget(
                    id = cursor.getLong(cursor.getColumnIndexOrThrow("id")),
                    categoryId = cursor.getLong(cursor.getColumnIndexOrThrow("category_id")),
                    amount = cursor.getDouble(cursor.getColumnIndexOrThrow("amount")),
                    month = cursor.getInt(cursor.getColumnIndexOrThrow("month")),
                    year = cursor.getInt(cursor.getColumnIndexOrThrow("year"))
                )
            )
        }
        cursor.close()
        return list
    }

    fun setBudget(budget: Budget) {
        val db = dbHelper.writableDatabase
        // Delete if already exists for same category, month and year
        db.delete(
            MokeepDatabaseHelper.TABLE_BUDGETS,
            "category_id = ? AND month = ? AND year = ?",
            arrayOf(budget.categoryId.toString(), budget.month.toString(), budget.year.toString())
        )
        val cv = ContentValues().apply {
            put("category_id", budget.categoryId)
            put("amount", budget.amount)
            put("month", budget.month)
            put("year", budget.year)
        }
        db.insert(MokeepDatabaseHelper.TABLE_BUDGETS, null, cv)
    }

    fun deleteBudget(budgetId: Long) {
        val db = dbHelper.writableDatabase
        db.delete(MokeepDatabaseHelper.TABLE_BUDGETS, "id = ?", arrayOf(budgetId.toString()))
    }

    // ----------------- GOALS (TARGET TABUNGAN) -----------------
    fun getGoals(): List<Goal> {
        val list = mutableListOf<Goal>()
        val db = dbHelper.readableDatabase
        val cursor = db.query(MokeepDatabaseHelper.TABLE_GOALS, null, null, null, null, null, "id DESC")
        while (cursor.moveToNext()) {
            val targetAccIdx = cursor.getColumnIndexOrThrow("target_account_id")
            list.add(
                Goal(
                    id = cursor.getLong(cursor.getColumnIndexOrThrow("id")),
                    name = cursor.getString(cursor.getColumnIndexOrThrow("name")),
                    targetAmount = cursor.getDouble(cursor.getColumnIndexOrThrow("target_amount")),
                    currentAmount = cursor.getDouble(cursor.getColumnIndexOrThrow("current_amount")),
                    deadlineMillis = cursor.getLong(cursor.getColumnIndexOrThrow("deadline_millis")),
                    targetAccountId = if (cursor.isNull(targetAccIdx)) null else cursor.getLong(targetAccIdx)
                )
            )
        }
        cursor.close()
        return list
    }

    fun addGoal(goal: Goal): Long {
        val db = dbHelper.writableDatabase
        val cv = ContentValues().apply {
            put("name", goal.name)
            put("target_amount", goal.targetAmount)
            put("current_amount", goal.currentAmount)
            put("deadline_millis", goal.deadlineMillis)
            put("target_account_id", goal.targetAccountId)
        }
        return db.insert(MokeepDatabaseHelper.TABLE_GOALS, null, cv)
    }

    fun contributeGoal(goalId: Long, amount: Double) {
        val db = dbHelper.writableDatabase
        db.execSQL("UPDATE ${MokeepDatabaseHelper.TABLE_GOALS} SET current_amount = current_amount + $amount WHERE id = $goalId")
    }

    fun deleteGoal(goalId: Long) {
        val db = dbHelper.writableDatabase
        db.delete(MokeepDatabaseHelper.TABLE_GOALS, "id = ?", arrayOf(goalId.toString()))
    }

    // CSV Export
    fun exportTransactionsCsv(): String {
        val txs = getTransactions()
        val accounts = getAccounts().associateBy { it.id }
        val categories = getCategories().associateBy { it.id }

        val sb = StringBuilder()
        sb.append("ID,Tanggal,Jenis,Jumlah,Akun,Akun_Tujuan,Kategori,Catatan\n")
        val sdf = java.text.SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        for (tx in txs) {
            val dateStr = sdf.format(Date(tx.dateMillis))
            val accName = accounts[tx.accountId]?.name ?: "Akun #${tx.accountId}"
            val toAccName = tx.toAccountId?.let { accounts[it]?.name } ?: ""
            val catName = tx.categoryId?.let { categories[it]?.name } ?: ""
            val noteSafe = (tx.note ?: "").replace(",", ";")
            sb.append("${tx.id},$dateStr,${tx.type.name},${tx.amount},$accName,$toAccName,$catName,$noteSafe\n")
        }
        return sb.toString()
    }
}
