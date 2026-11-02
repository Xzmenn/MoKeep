package com.mokeep.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.mokeep.app.data.repository.MokeepRepository
import com.mokeep.app.ui.screens.*
import com.mokeep.app.ui.theme.MokeepTheme

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Transactions : Screen("transactions", "Transaksi", Icons.Default.ReceiptLong)
    object Accounts : Screen("accounts", "Dompet", Icons.Default.AccountBalanceWallet)
    object Budgets : Screen("budgets", "Anggaran", Icons.Default.PieChart)
    object Reports : Screen("reports", "Laporan", Icons.Default.BarChart)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val repository = MokeepRepository(applicationContext)

        setContent {
            MokeepTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                var showQuickAddTransaction by remember { mutableStateOf(false) }

                val items = listOf(
                    Screen.Dashboard,
                    Screen.Transactions,
                    Screen.Accounts,
                    Screen.Budgets,
                    Screen.Reports
                )

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar {
                            items.forEach { screen ->
                                NavigationBarItem(
                                    icon = { Icon(screen.icon, contentDescription = screen.title) },
                                    label = { Text(screen.title) },
                                    selected = currentRoute == screen.route,
                                    onClick = {
                                        if (currentRoute != screen.route) {
                                            navController.navigate(screen.route) {
                                                popUpTo(navController.graph.startDestinationId) {
                                                    saveState = true
                                                }
                                                launchSingleTop = true
                                                restoreState = true
                                            }
                                        }
                                    }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = Screen.Dashboard.route,
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable(Screen.Dashboard.route) {
                            DashboardScreen(
                                repository = repository,
                                onNavigateToTransactions = { navController.navigate(Screen.Transactions.route) },
                                onNavigateToAccounts = { navController.navigate(Screen.Accounts.route) },
                                onAddTransactionClick = { showQuickAddTransaction = true }
                            )
                        }
                        composable(Screen.Transactions.route) {
                            TransactionsScreen(repository = repository)
                        }
                        composable(Screen.Accounts.route) {
                            AccountsScreen(repository = repository)
                        }
                        composable(Screen.Budgets.route) {
                            BudgetsAndGoalsScreen(repository = repository)
                        }
                        composable(Screen.Reports.route) {
                            ReportsAndSettingsScreen(repository = repository)
                        }
                    }

                    if (showQuickAddTransaction) {
                        val accounts = repository.getAccounts()
                        val categories = repository.getCategories()
                        if (accounts.isNotEmpty()) {
                            AddTransactionDialog(
                                accounts = accounts,
                                categories = categories,
                                onDismiss = { showQuickAddTransaction = false },
                                onSave = { newTx ->
                                    repository.addTransaction(newTx)
                                    showQuickAddTransaction = false
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
