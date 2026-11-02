package com.mokeep.app.ui.screens

import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import java.io.File
import java.io.FileOutputStream
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BudgetsAndGoalsScreen(
    repository: MokeepRepository
) {
    var selectedTab by remember { mutableStateOf(0) } // 0 = Anggaran, 1 = Target Tabungan

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Anggaran & Target", fontWeight = FontWeight.Bold) }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Anggaran Bulanan") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Target Tabungan") }
                )
            }

            if (selectedTab == 0) {
                BudgetsTabContent(repository)
            } else {
                GoalsTabContent(repository)
            }
        }
    }
}

@Composable
fun BudgetsTabContent(repository: MokeepRepository) {
    val context = LocalContext.current
    var budgets by remember { mutableStateOf(repository.getBudgets()) }
    val categories = remember { mutableStateOf(repository.getCategories().filter { it.type == TransactionType.EXPENSE }) }
    val transactions = remember { mutableStateOf(repository.getTransactions()) }

    var showSetBudgetDialog by remember { mutableStateOf(false) }

    val currentMonth = Calendar.getInstance().get(Calendar.MONTH) + 1
    val currentYear = Calendar.getInstance().get(Calendar.YEAR)

    // Calculate actual spending per category for this month
    val spendingMap = transactions.value
        .filter { it.type == TransactionType.EXPENSE && it.categoryId != null }
        .groupBy { it.categoryId!! }
        .mapValues { entry -> entry.value.sumOf { it.amount } }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Bulan Ini (${currentMonth}/${currentYear})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Button(onClick = { showSetBudgetDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Set Budget")
                    }
                }
            }

            if (budgets.isEmpty()) {
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text("Belum ada anggaran bulanan yang dibuat.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            } else {
                items(budgets) { b ->
                    val catName = categories.value.firstOrNull { it.id == b.categoryId }?.name ?: "Kategori #${b.categoryId}"
                    val spent = spendingMap[b.categoryId] ?: 0.0
                    val progress = if (b.amount > 0) (spent / b.amount).toFloat().coerceIn(0f, 1f) else 0f
                    val isOver = spent > b.amount

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(text = catName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                IconButton(
                                    onClick = {
                                        repository.deleteBudget(b.id)
                                        budgets = repository.getBudgets()
                                    },
                                    modifier = Modifier.size(20.dp)
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = "Hapus", tint = Color.Gray, modifier = Modifier.size(16.dp))
                                }
                            }

                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(8.dp),
                                color = if (isOver) Color(0xFFEF4444) else MaterialTheme.colorScheme.primary,
                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Terpakai: ${MokeepRepository.formatRupiah(spent)}",
                                    fontSize = 12.sp,
                                    color = if (isOver) Color(0xFFDC2626) else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Batas: ${MokeepRepository.formatRupiah(b.amount)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (showSetBudgetDialog && categories.value.isNotEmpty()) {
        var selectedCat by remember { mutableStateOf(categories.value.first()) }
        var budgetAmount by remember { mutableStateOf("") }

        AlertDialog(
            onDismissRequest = { showSetBudgetDialog = false },
            title = { Text("Atur Anggaran Bulanan", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("Pilih Kategori Pengeluaran:")
                    categories.value.forEach { cat ->
                        FilterChip(
                            selected = selectedCat.id == cat.id,
                            onClick = { selectedCat = cat },
                            label = { Text(cat.name) }
                        )
                    }

                    OutlinedTextField(
                        value = budgetAmount,
                        onValueChange = { budgetAmount = it },
                        label = { Text("Batas Anggaran (Rp) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val parsed = budgetAmount.toDoubleOrNull() ?: 0.0
                        if (parsed <= 0) {
                            Toast.makeText(context, "Jumlah harus lebih dari 0", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        repository.setBudget(
                            Budget(
                                categoryId = selectedCat.id,
                                amount = parsed,
                                month = currentMonth,
                                year = currentYear
                            )
                        )
                        budgets = repository.getBudgets()
                        showSetBudgetDialog = false
                        Toast.makeText(context, "Anggaran berhasil disimpan!", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text("Simpan")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSetBudgetDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }
}

@Composable
fun GoalsTabContent(repository: MokeepRepository) {
    val context = LocalContext.current
    var goals by remember { mutableStateOf(repository.getGoals()) }
    var showAddGoalDialog by remember { mutableStateOf(false) }
    var selectedGoalForContribution by remember { mutableStateOf<Goal?>(null) }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Target Tabungan (Impian)",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Button(onClick = { showAddGoalDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Tambah Target")
                    }
                }
            }

            if (goals.isEmpty()) {
                item {
                    Card(modifier = Modifier.fillMaxWidth()) {
                        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text("Belum ada target tabungan.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            } else {
                items(goals) { g ->
                    val progress = if (g.targetAmount > 0) (g.currentAmount / g.targetAmount).toFloat().coerceIn(0f, 1f) else 0f
                    val percentage = (progress * 100).toInt()

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = g.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text(
                                    text = "$percentage%",
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }

                            LinearProgressIndicator(
                                progress = { progress },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(10.dp),
                                color = MaterialTheme.colorScheme.primary,
                                trackColor = MaterialTheme.colorScheme.surfaceVariant
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Terkumpul: ${MokeepRepository.formatRupiah(g.currentAmount)}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "Target: ${MokeepRepository.formatRupiah(g.targetAmount)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.End
                            ) {
                                TextButton(onClick = {
                                    repository.deleteGoal(g.id)
                                    goals = repository.getGoals()
                                }) {
                                    Text("Hapus", color = Color(0xFFDC2626))
                                }
                                Button(onClick = { selectedGoalForContribution = g }) {
                                    Text("+ Tabung")
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showAddGoalDialog) {
        var goalName by remember { mutableStateOf("") }
        var targetAmount by remember { mutableStateOf("") }
        var initialSaved by remember { mutableStateOf("0") }

        AlertDialog(
            onDismissRequest = { showAddGoalDialog = false },
            title = { Text("Buat Target Tabungan Baru", fontWeight = FontWeight.Bold) },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = goalName,
                        onValueChange = { goalName = it },
                        label = { Text("Nama Impian / Target *") },
                        placeholder = { Text("Contoh: Beli Laptop Baru, Liburan") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = targetAmount,
                        onValueChange = { targetAmount = it },
                        label = { Text("Jumlah Target (Rp) *") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )

                    OutlinedTextField(
                        value = initialSaved,
                        onValueChange = { initialSaved = it },
                        label = { Text("Terkumpul Saat Ini (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val parsedTarget = targetAmount.toDoubleOrNull() ?: 0.0
                        if (goalName.isBlank() || parsedTarget <= 0) {
                            Toast.makeText(context, "Lengkapi data target", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        repository.addGoal(
                            Goal(
                                name = goalName.trim(),
                                targetAmount = parsedTarget,
                                currentAmount = initialSaved.toDoubleOrNull() ?: 0.0,
                                deadlineMillis = System.currentTimeMillis() + (30L * 24 * 60 * 60 * 1000)
                            )
                        )
                        goals = repository.getGoals()
                        showAddGoalDialog = false
                        Toast.makeText(context, "Target tabungan berhasil dibuat!", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text("Simpan")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddGoalDialog = false }) {
                    Text("Batal")
                }
            }
        )
    }

    if (selectedGoalForContribution != null) {
        var addAmount by remember { mutableStateOf("") }
        val target = selectedGoalForContribution!!

        AlertDialog(
            onDismissRequest = { selectedGoalForContribution = null },
            title = { Text("Tambah Tabungan (${target.name})", fontWeight = FontWeight.Bold) },
            text = {
                OutlinedTextField(
                    value = addAmount,
                    onValueChange = { addAmount = it },
                    label = { Text("Nominal Tambahan (Rp) *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val parsed = addAmount.toDoubleOrNull() ?: 0.0
                        if (parsed <= 0) {
                            Toast.makeText(context, "Nominal harus lebih dari 0", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        repository.contributeGoal(target.id, parsed)
                        goals = repository.getGoals()
                        selectedGoalForContribution = null
                        Toast.makeText(context, "Berhasil menambah tabungan!", Toast.LENGTH_SHORT).show()
                    }
                ) {
                    Text("Simpan")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedGoalForContribution = null }) {
                    Text("Batal")
                }
            }
        )
    }
}
