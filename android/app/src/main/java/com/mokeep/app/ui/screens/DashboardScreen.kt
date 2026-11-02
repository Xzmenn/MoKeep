package com.mokeep.app.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mokeep.app.data.model.*
import com.mokeep.app.data.repository.MokeepRepository
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    repository: MokeepRepository,
    onNavigateToTransactions: () -> Unit,
    onNavigateToAccounts: () -> Unit,
    onAddTransactionClick: () -> Unit
) {
    val accounts = remember { mutableStateOf(repository.getAccounts()) }
    val transactions = remember { mutableStateOf(repository.getTransactions()) }
    val categories = remember { mutableStateOf(repository.getCategories().associateBy { it.id }) }

    val totalBalance = accounts.value.sumOf { it.currentBalance }
    val totalIncome = transactions.value.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
    val totalExpense = transactions.value.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Mokeep Mobile",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Pencatat Keuangan Offline",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                IconButton(
                    onClick = onAddTransactionClick,
                    colors = IconButtonDefaults.filledIconButtonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Tambah Transaksi", tint = Color.White)
                }
            }
        }

        // Net Worth Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "TOTAL SALDO BERSIH (NET WORTH)",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                    )
                    Text(
                        text = MokeepRepository.formatRupiah(totalBalance),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )

                    HorizontalDivider(color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.2f))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.ArrowDownward, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Pemasukan", fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f))
                            }
                            Text(
                                text = MokeepRepository.formatRupiah(totalIncome),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF059669)
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.ArrowUpward, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Pengeluaran", fontSize = 12.sp, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f))
                            }
                            Text(
                                text = MokeepRepository.formatRupiah(totalExpense),
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFDC2626)
                            )
                        }
                    }
                }
            }
        }

        // Pocket & Accounts Carousel
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Dompet & Akun Anda",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onNavigateToAccounts) {
                    Text("Lihat Semua")
                }
            }

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(accounts.value) { acc ->
                    Card(
                        modifier = Modifier
                            .width(170.dp)
                            .height(115.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(32.dp)
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
                                        modifier = Modifier.size(18.dp)
                                    )
                                }

                                Text(
                                    text = acc.type.name,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Column {
                                Text(
                                    text = acc.name,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1
                                )
                                Text(
                                    text = MokeepRepository.formatRupiah(acc.currentBalance),
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    }
                }
            }
        }

        // Recent Transactions Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Transaksi Terakhir",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onNavigateToTransactions) {
                    Text("Semua")
                }
            }
        }

        if (transactions.value.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "Belum ada transaksi. Tap (+) untuk mencatat!",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        } else {
            items(transactions.value.take(5)) { tx ->
                TransactionRowItem(
                    tx = tx,
                    accounts = accounts.value.associateBy { it.id },
                    categories = categories.value
                )
            }
        }
    }
}

@Composable
fun TransactionRowItem(
    tx: TransactionItem,
    accounts: Map<Long, Account>,
    categories: Map<Long, Category>,
    onDeleteClick: (() -> Unit)? = null
) {
    val sdf = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale("id", "ID"))
    val dateText = sdf.format(Date(tx.dateMillis))

    val accountName = accounts[tx.accountId]?.name ?: "Akun #${tx.accountId}"
    val categoryName = categories[tx.categoryId]?.name ?: (if (tx.type == TransactionType.TRANSFER) "Transfer Antar Dompet" else "Umum")

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(CircleShape)
                        .background(
                            when (tx.type) {
                                TransactionType.INCOME -> Color(0xFFD1FAE5)
                                TransactionType.EXPENSE -> Color(0xFFFEE2E2)
                                TransactionType.TRANSFER -> Color(0xFFDBEAFE)
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        when (tx.type) {
                            TransactionType.INCOME -> Icons.Default.ArrowDownward
                            TransactionType.EXPENSE -> Icons.Default.ArrowUpward
                            TransactionType.TRANSFER -> Icons.Default.SwapHoriz
                        },
                        contentDescription = null,
                        tint = when (tx.type) {
                            TransactionType.INCOME -> Color(0xFF059669)
                            TransactionType.EXPENSE -> Color(0xFFDC2626)
                            TransactionType.TRANSFER -> Color(0xFF2563EB)
                        },
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = if (!tx.note.isNullOrBlank()) tx.note else categoryName,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp,
                        maxLines = 1
                    )
                    Text(
                        text = "$accountName • $dateText",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = when (tx.type) {
                        TransactionType.INCOME -> "+ ${MokeepRepository.formatRupiah(tx.amount)}"
                        TransactionType.EXPENSE -> "- ${MokeepRepository.formatRupiah(tx.amount)}"
                        TransactionType.TRANSFER -> MokeepRepository.formatRupiah(tx.amount)
                    },
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = when (tx.type) {
                        TransactionType.INCOME -> Color(0xFF059669)
                        TransactionType.EXPENSE -> Color(0xFFDC2626)
                        TransactionType.TRANSFER -> Color(0xFF2563EB)
                    }
                )

                if (onDeleteClick != null) {
                    IconButton(
                        onClick = onDeleteClick,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = Color.Gray, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}
