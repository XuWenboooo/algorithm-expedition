// 冒泡排序参考（与课程演示同一算法）：n + 数组 → 排序结果
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    for (int i = 0; i + 1 < n; i++) {
        bool sw = false;
        for (int j = 0; j + 1 < n - i; j++) {
            if (a[j] > a[j + 1]) { swap(a[j], a[j + 1]); sw = true; }
        }
        if (!sw) break;
    }
    for (int i = 0; i < n; i++) cout << a[i] << " \n"[i + 1 == n];
    return 0;
}
