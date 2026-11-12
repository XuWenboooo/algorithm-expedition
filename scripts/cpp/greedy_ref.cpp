// 区间调度贪心参考：n + n 行 l r → 最大不重叠区间数（按右端点贪心）
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<pair<int, int>> segs(n);
    for (auto& s : segs) cin >> s.second >> s.first;   // (r, l) 便于按 r 排
    sort(segs.begin(), segs.end());
    int count = 0, lastEnd = -1;
    for (auto& [r, l] : segs) {
        if (l >= lastEnd) { count++; lastEnd = r; }
    }
    cout << count << "\n";
    return 0;
}
