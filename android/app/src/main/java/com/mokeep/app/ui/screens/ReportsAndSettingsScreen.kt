package com.mokeep.app.ui.screens

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.core.content.FileProvider
import com.mokeep.app.data.model.TransactionType
import com.mokeep.app.data.repository.MokeepRepository
import java.io.File
import java.io.FileOutputStream

data class CategoryExpense(
    val categoryId: Long,
    val amount: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsAndSettingsScreen(
    repository: MokeepRepository
) {
    val context = LocalContext.current
    val transactions = remember { repository.getTransactions() }
    val categories = remember { repository.getCategories().associateBy { it.id } }

    val totalIncome = transactions.filter { it.type == TransactionType.INCOME }.sumOf { it.amount }
    val totalExpense = transactions.filter { it.type == TransactionType.EXPENSE }.sumOf { it.amount }
    val netCashflow = totalIncome - totalExpense

    // Group expenses by category
    val expensesByCategory: List<CategoryExpense> = transactions
        .filter { it.type == TransactionType.EXPENSE && it.categoryId != null }
        .groupBy { it.categoryId!! }
        .map { (catId, txList) -> CategoryExpense(catId, txList.sumOf { it.amount }) }
        .sortedByDescending { it.amount }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Laporan & Ekspor", fontWeight = FontWeight.Bold) }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Arus Kas Ringkasan
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Ringkasan Arus Kas", fontWeight = FontWeight.Bold, fontSize = 16.sp)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Pemasukan", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(MokeepRepository.formatRupiah(totalIncome), fontWeight = FontWeight.Bold, color = Color(0xFF059669))
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Total Pengeluaran", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(MokeepRepository.formatRupiah(totalExpense), fontWeight = FontWeight.Bold, color = Color(0xFFDC2626))
                        }

                        HorizontalDivider()

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Selisih Bersih (Cashflow)", fontWeight = FontWeight.SemiBold)
                            Text(
                                MokeepRepository.formatRupiah(netCashflow),
                                fontWeight = FontWeight.Bold,
                                color = if (netCashflow >= 0) Color(0xFF059669) else Color(0xFFDC2626)
                            )
                        }
                    }
                }
            }

            // Pengeluaran per Kategori
            item {
                Text("Pengeluaran Terbesar per Kategori", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }

            if (expensesByCategory.isEmpty()) {
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            Text("Belum ada data pengeluaran.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            } else {
                items(expensesByCategory) { itemExpense ->
                    val catName = categories[itemExpense.categoryId]?.name ?: "Kategori #${itemExpense.categoryId}"
                    val percent = if (totalExpense > 0.0) ((itemExpense.amount / totalExpense) * 100.0).toInt() else 0

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(catName, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                    Text("$percent% dari total", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }

                            Text(
                                text = MokeepRepository.formatRupiah(itemExpense.amount),
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }

            // Export Section
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Download, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Ekspor Data Lokal (100% Offline)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                        Text(
                            text = "Seluruh data transaksi dan dompet tersimpan secara aman di memori HP Anda. Anda dapat mengekspornya ke format CSV kapan saja.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                        )

                        Button(
                            onClick = {
                                try {
                                    val csvContent = repository.exportTransactionsCsv()
                                    val exportFile = File(context.cacheDir, "mokeep_transaksi.csv")
                                    FileOutputStream(exportFile).use { it.write(csvContent.toByteArray()) }

                                    val uri = FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.fileprovider",
                                        exportFile
                                    )

                                    val sendIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/csv"
                                        putExtra(Intent.EXTRA_STREAM, uri)
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    }
                                    context.startActivity(Intent.createChooser(sendIntent, "Ekspor CSV Transaksi Mokeep"))
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                    Toast.makeText(context, "Gagal mengekspor: ${e.message}", Toast.LENGTH_LONG).show()
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Bagikan / Simpan File CSV")
                        }
                    }
                }
            }
        }
    }
}
