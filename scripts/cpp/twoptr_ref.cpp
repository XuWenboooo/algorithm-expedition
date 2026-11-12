// 对撞双指针参考：n + 有序数组 + target → "l r" 或 "-1"
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;
    int target; cin >> target;
    int l = 0, r = n - 1;
    while (l < r) {
        int s = a[l] + a[r];
        if (s == target) { cout << l << " " << r << "\n"; return 0; }
        else if (s < target) l++;
        else r--;
    }
    cout << -1 << "\n";
    return 0;
}
