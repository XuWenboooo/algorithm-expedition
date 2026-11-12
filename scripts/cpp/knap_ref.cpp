// 0/1 背包参考：n W + n 行 w v → 最大价值
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, W;
    cin >> n >> W;
    vector<int> w(n), v(n);
    for (int i = 0; i < n; i++) cin >> w[i] >> v[i];
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++)
        for (int c = 0; c <= W; c++) {
            dp[i][c] = dp[i - 1][c];
            if (c >= w[i - 1]) dp[i][c] = max(dp[i][c], dp[i - 1][c - w[i - 1]] + v[i - 1]);
        }
    cout << dp[n][W] << "\n";
    return 0;
}
