// LIS 参考（O(n²) 与 O(n log n) 双实现互验）：n + 序列 → 长度
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    // O(n²)
    vector<int> dp(n, 1);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < i; j++)
            if (a[j] < a[i]) dp[i] = max(dp[i], dp[j] + 1);
    int slow = 0;
    for (int i = 0; i < n; i++) slow = max(slow, dp[i]);
    // O(n log n)
    vector<int> tails;
    for (int x : a) {
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    if (slow != (int)tails.size()) { cout << "MISMATCH\n"; return 1; }
    cout << slow << "\n";
    return 0;
}
