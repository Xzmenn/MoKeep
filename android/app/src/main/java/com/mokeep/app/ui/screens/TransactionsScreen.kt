package com.mokeep.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mokeep.app.data.model.*
import com.mokeep.app.data.repository.MokeepRepository

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransactionsScreen(
    repository: MokeepRepository
) {
    val context = LocalContext.current
    var transactions by remember { mutableStateOf(repository.getTransactions()) }
    val accounts = remember { mutableStateOf(repository.getAccounts()) }
    val categories = remember { mutableStateOf(repository.getCategories()) }

    var searchQuery by remember { mutableStateOf("") }
    var selectedTypeFilter by remember { mutableStateOf<TransactionType?>(null) }
    var showAddDialog by remember { mutableStateOf(false) }

    val filteredTransactions = transactions.filter { tx ->
        val matchType = selectedTypeFilter == null || tx.type == selectedTypeFilter
        val matchQuery = searchQuery.isBlank() || (tx.note ?: "").contains(searchQuery, ignoreCase = true)
        matchType && matchQuery
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Riwayat Transaksi", fontWeight = FontWeight.Bold) }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Tambah")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Cari catatan transaksi...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp)
            )

            // Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 12.dp)
            ) {
                item {
                    FilterChip(
                        selected = selectedTypeFilter == null,
                        onClick = { selectedTypeFilter = null },
                        label = { Text("Semua") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedTypeFilter == TransactionType.EXPENSE,
                        onClick = { selectedTypeFilter = TransactionType.EXPENSE },
                        label = { Text("Pengeluaran") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedTypeFilter == TransactionType.INCOME,
                        onClick = { selectedTypeFilter = TransactionType.INCOME },
                        label = { Text("Pemasukan") }
                    )
                }
                item {
                    FilterChip(
                        selected = selectedTypeFilter == TransactionType.TRANSFER,
                        onClick = { selectedTypeFilter = TransactionType.TRANSFER },
                        label = { Text("Transfer") }
                    )
                }
            }

            // Transaction List
            if (filteredTransactions.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Tidak ada transaksi ditemukan",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(filteredTransactions, key = { it.id }) { tx ->
                        TransactionRowItem(
                            tx = tx,
                            accounts = accounts.value.associateBy { it.id },
                            categories = categories.value.associateBy { it.id },
                            onDeleteClick = {
                                repository.deleteTransaction(tx)
                                transactions = repository.getTransactions()
                                accounts.value = repository.getAccounts()
                                Toast.makeText(context, "Transaksi berhasil dihapus", Toast.LENGTH_SHORT).show()
                            }
                        )
                    }
                }
            }
        }
    }

    // Modal Catat Transaksi Baru
    if (showAddDialog && accounts.value.isNotEmpty()) {
        AddTransactionDialog(
            accounts = accounts.value,
            categories = categories.value,
            onDismiss = { showAddDialog = false },
            onSave = { newTx ->
                repository.addTransaction(newTx)
                transactions = repository.getTransactions()
                accounts.value = repository.getAccounts()
                showAddDialog = false
                Toast.makeText(context, "Transaksi berhasil disimpan!", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTransactionDialog(
    accounts: List<Account>,
    categories: List<Category>,
    onDismiss: () -> Unit,
    onSave: (TransactionItem) -> Unit
) {
    var type by remember { mutableStateOf(TransactionType.EXPENSE) }
    var amount by remember { mutableStateOf("") }
    var selectedAccount by remember { mutableStateOf(accounts.first()) }
    var selectedToAccount by remember { mutableStateOf(accounts.getOrNull(1) ?: accounts.first()) }
    var selectedCategory by remember { mutableStateOf(categories.firstOrNull { it.type == type } ?: categories.firstOrNull()) }
    var note by remember { mutableStateOf("") }

    val context = LocalContext.current

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Catat Transaksi", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Type selector
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterChip(
                        selected = type == TransactionType.EXPENSE,
                        onClick = {
                            type = TransactionType.EXPENSE
                            selectedCategory = categories.firstOrNull { it.type == TransactionType.EXPENSE }
                        },
                        label = { Text("Pengeluaran") }
                    )
                    FilterChip(
                        selected = type == TransactionType.INCOME,
                        onClick = {
                            type = TransactionType.INCOME
                            selectedCategory = categories.firstOrNull { it.type == TransactionType.INCOME }
                        },
                        label = { Text("Pemasukan") }
                    )
                    FilterChip(
                        selected = type == TransactionType.TRANSFER,
                        onClick = { type = TransactionType.TRANSFER },
                        label = { Text("Transfer") }
                    )
                }

                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Nominal (Rp) *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                // Pilih Dompet Sumber
                Text("Dari Akun / Dompet:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    items(accounts) { acc ->
                        FilterChip(
                            selected = selectedAccount.id == acc.id,
                            onClick = { selectedAccount = acc },
                            label = { Text(acc.name, fontSize = 11.sp) }
                        )
                    }
                }

                // Jika Transfer, Pilih Tujuan
                if (type == TransactionType.TRANSFER) {
                    Text("Ke Dompet Tujuan:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        items(accounts) { acc ->
                            FilterChip(
                                selected = selectedToAccount.id == acc.id,
                                onClick = { selectedToAccount = acc },
                                label = { Text(acc.name, fontSize = 11.sp) }
                            )
                        }
                    }
                } else {
                    // Pilih Kategori
                    val availableCats = categories.filter { it.type == type }
                    if (availableCats.isNotEmpty()) {
                        Text("Kategori:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            items(availableCats) { cat ->
                                FilterChip(
                                    selected = selectedCategory?.id == cat.id,
                                    onClick = { selectedCategory = cat },
                                    label = { Text(cat.name, fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Catatan / Keterangan") },
                    placeholder = { Text("Contoh: Makan siang, beli kopi, bonus") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amountParsed = amount.toDoubleOrNull() ?: 0.0
                    if (amountParsed <= 0) {
                        Toast.makeText(context, "Nominal harus lebih dari 0", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (type == TransactionType.TRANSFER && selectedAccount.id == selectedToAccount.id) {
                        Toast.makeText(context, "Akun asal dan tujuan tidak boleh sama", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    onSave(
                        TransactionItem(
                            type = type,
                            amount = amountParsed,
                            dateMillis = System.currentTimeMillis(),
                            accountId = selectedAccount.id,
                            toAccountId = if (type == TransactionType.TRANSFER) selectedToAccount.id else null,
                            categoryId = if (type != TransactionType.TRANSFER) selectedCategory?.id else null,
                            note = note.trim().ifEmpty { null }
                        )
                    )
                }
            ) {
                Text("Simpan")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
