// 二分参考（第一个 >= x）：n + 有序数组 + x → 答案下标（n 表示不存在）
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    int x; cin >> x;
    int lo = 0, hi = n;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= x) hi = mid; else lo = mid + 1;
    }
    cout << lo << "\n";
    return 0;
}
