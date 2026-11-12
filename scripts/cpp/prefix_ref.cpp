// 前缀和参考：n + 数组 + 查询 l r（0-based，含端点）→ pre 数组 + 查询结果
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<long long> pre(n + 1, 0);
    for (int k = 1; k <= n; k++) pre[k] = pre[k - 1] + a[k - 1];
    for (int k = 0; k <= n; k++) cout << pre[k] << " \n"[k == n];
    int l, r; cin >> l >> r;
    cout << pre[r + 1] - pre[l] << "\n";
    return 0;
}
