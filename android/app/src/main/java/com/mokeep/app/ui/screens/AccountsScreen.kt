package com.mokeep.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
fun AccountsScreen(
    repository: MokeepRepository
) {
    val context = LocalContext.current
    var accounts by remember { mutableStateOf(repository.getAccounts()) }
    var showAddDialog by remember { mutableStateOf(false) }
    var showTransferDialog by remember { mutableStateOf(false) }

    val totalBalance = accounts.sumOf { it.currentBalance }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Dompet & Akun", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { showTransferDialog = true }) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = "Transfer Antar Dompet")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Tambah Dompet")
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Net Worth Summary
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "TOTAL SALDO DOMPET & REKENING",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = MokeepRepository.formatRupiah(totalBalance),
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = "Terbagi dalam ${accounts.size} dompet aktif",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            items(accounts) { acc ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(Color(acc.color)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    when (acc.type) {
                                        AccountType.CASH -> Icons.Default.AccountBalanceWallet
                                        AccountType.BANK -> Icons.Default.AccountBalance
                                        AccountType.EWALLET -> Icons.Default.Smartphone
                                        AccountType.CREDIT_CARD -> Icons.Default.CreditCard
                                        AccountType.INVESTMENT -> Icons.Default.TrendingUp
                                    },
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column {
                                Text(
                                    text = acc.name,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                                Text(
                                    text = if (!acc.accountNumber.isNullOrBlank()) "${acc.type.label} • ${acc.accountNumber}" else acc.type.label,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Text(
                            text = MokeepRepository.formatRupiah(acc.currentBalance),
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }

    // Modal Tambah Dompet / Akun (Rekening BUKAN hal wajib!)
    if (showAddDialog) {
        var name by remember { mutableStateOf("") }
        var selectedType by remember { mutableStateOf(AccountType.CASH) }
        var initialBalance by remember { mutableStateOf("0") }
        var accountNumber by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showAddDialog = false },
            title = { Text("Tambah Dompet / Pocket Baru", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Nama Dompet / Pocket *") },
                        placeholder = { Text("Contoh: Dompet Kas, Uang Jajan, BCA") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Type Selector
                    Text("Jenis Akun", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        FilterChip(
                            selected = selectedType == AccountType.CASH,
                            onClick = { selectedType = AccountType.CASH },
                            label = { Text("Kas/Pocket") }
                        )
                        FilterChip(
                            selected = selectedType == AccountType.EWALLET,
                            onClick = { selectedType = AccountType.EWALLET },
                            label = { Text("E-Wallet") }
                        )
                        FilterChip(
                            selected = selectedType == AccountType.BANK,
                            onClick = { selectedType = AccountType.BANK },
                            label = { Text("Bank") }
                        )
                    }

                    OutlinedTextField(
                        value = initialBalance,
                        onValueChange = { initialBalance = it },
                        label = { Text("Saldo Awal (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Rekening HANYA tampil jika bukan CASH, dan JELAS OPSIONAL
                    if (selectedType != AccountType.CASH) {
                        OutlinedTextField(
                            value = accountNumber,
                            onValueChange = { accountNumber = it },
                            label = { Text("Nomor Rekening / HP (Opsional)") },
                            placeholder = { Text("Boleh dikosongkan") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            Toast.makeText(context, "Nama dompet wajib diisi", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        val balanceParsed = initialBalance.toDoubleOrNull() ?: 0.0
                        val colorVal = when (selectedType) {
                            AccountType.CASH -> 0xFF10B981
                            AccountType.EWALLET -> 0xFF0EA5E9
                            AccountType.BANK -> 0xFF3B82F6
                            AccountType.CREDIT_CARD -> 0xFFEF4444
                            AccountType.INVESTMENT -> 0xFF8B5CF6
                        }
                        repository.addAccount(
                            Account(
                                name = name.trim(),
                                type = selectedType,
                                initialBalance = balanceParsed,
                                currentBalance = balanceParsed,
                                accountNumber = if (accountNumber.isBlank()) null else accountNumber.trim(),
                                color = colorVal
                            )
                        )
                        accounts = repository.getAccounts()
                        showAddDialog = false
                        Toast.makeText(context, "Dompet berhasil dibuat!", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text("Simpan")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }

    // Modal Transfer Antar Dompet
    if (showTransferDialog && accounts.size >= 2) {
        var fromAccount by remember { mutableStateOf(accounts[0]) }
        var toAccount by remember { mutableStateOf(accounts[1]) }
        var transferAmount by remember { mutableStateOf("") }
        var transferNote by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showTransferDialog = false },
            title = { Text("Transfer Antar Dompet", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("Dari Dompet:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        accounts.forEach { acc ->
                            FilterChip(
                                selected = fromAccount.id == acc.id,
                                onClick = { fromAccount = acc },
                                label = { Text(acc.name, fontSize = 11.sp) }
                            )
                        }
                    }

                    Text("Ke Dompet Tujuan:", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        accounts.forEach { acc ->
                            FilterChip(
                                selected = toAccount.id == acc.id,
                                onClick = { toAccount = acc },
                                label = { Text(acc.name, fontSize = 11.sp) }
                            )
                        }
                    }

                    OutlinedTextField(
                        value = transferAmount,
                        onValueChange = { transferAmount = it },
                        label = { Text("Nominal Transfer (Rp) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = transferNote,
                        onValueChange = { transferNote = it },
                        label = { Text("Catatan (Opsional)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amountParsed = transferAmount.toDoubleOrNull() ?: 0.0
                        if (amountParsed <= 0) {
                            Toast.makeText(context, "Nominal harus lebih dari 0", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (fromAccount.id == toAccount.id) {
                            Toast.makeText(context, "Dompet asal dan tujuan tidak boleh sama", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        repository.addTransaction(
                            TransactionItem(
                                type = TransactionType.TRANSFER,
                                amount = amountParsed,
                                dateMillis = System.currentTimeMillis(),
                                accountId = fromAccount.id,
                                toAccountId = toAccount.id,
                                note = if (transferNote.isBlank()) "Transfer ke ${toAccount.name}" else transferNote.trim()
                            )
                        )
                        accounts = repository.getAccounts()
                        showTransferDialog = false
                        Toast.makeText(context, "Transfer berhasil dicatat!", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text("Transfer")
                }
            },
            dismissButton = {
                TextButton(onClick = { showTransferDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }
}
