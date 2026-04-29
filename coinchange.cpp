#include <bits/stdc++.h>
using namespace std;

// GREEDY 
int greedyCoinChange(vector<int> coins, int target) {
    sort(coins.rbegin(), coins.rend()); 

    int count = 0;

    for (int coin : coins) {
        while (target >= coin) {
            target -= coin;
            count++;
        }
    }

    if (target != 0) return -1;
    return count;
}

// DP 
int dpCoinChange(vector<int>& coins, int target) {
    vector<int> dp(target + 1, INT_MAX);

    dp[0] = 0;

    for (int i = 1; i <= target; i++) {
        for (int coin : coins) {
            if (i - coin >= 0 && dp[i - coin] != INT_MAX) {
                dp[i] = min(dp[i], dp[i - coin] + 1);
            }
        }
    }

    return dp[target] == INT_MAX ? -1 : dp[target];
}

int main() {
    int n, target;

    cout << "Enter number of coins: ";
    cin >> n;

    vector<int> coins(n);
    cout << "Enter coin denominations: ";
    for (int i = 0; i < n; i++) cin >> coins[i];

    cout << "Enter target amount: ";
    cin >> target;

    int greedyAns = greedyCoinChange(coins, target);
    int dpAns = dpCoinChange(coins, target);

    cout << "\n--- Results ---\n";

    if (greedyAns == -1)
        cout << "Greedy: No solution\n";
    else
        cout << "Greedy: " << greedyAns << " coins\n";

    if (dpAns == -1)
        cout << "DP: No solution\n";
    else
        cout << "DP: " << dpAns << " coins\n";

    return 0;
}