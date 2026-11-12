// 离散化参考：n + n 个值 → 每个值的排名（排序去重后 lower_bound）
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (auto& x : a) cin >> x;
    vector<long long> cand = a;
    sort(cand.begin(), cand.end());
    cand.erase(unique(cand.begin(), cand.end()), cand.end());
    for (int i = 0; i < n; i++) {
        int rk = (int)(lower_bound(cand.begin(), cand.end(), a[i]) - cand.begin());
        cout << rk << " \n"[i + 1 == n];
    }
    return 0;
}
