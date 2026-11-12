// 线性探测哈希参考：m + 操作数 + 操作(+k/-k) → 最终表（-1 表示空）
// 注意：?k 查找不改变表状态，C++ 侧只重放 +/-
#include <bits/stdc++.h>
using namespace std;
int main() {
    int m; cin >> m;
    vector<int> table(m, -1);
    int q; cin >> q;
    while (q--) {
        string op; int k;
        cin >> op >> k;
        if (op == "+") {
            // 查重
            int p = k % m;
            bool exists = false;
            for (int step = 0; step < m; step++) {
                if (table[p] == -1) break;
                if (table[p] == k) { exists = true; break; }
                p = (p + 1) % m;
            }
            if (exists) continue;
            p = k % m;
            for (int step = 0; step < m; step++) {
                if (table[p] == -1) { table[p] = k; break; }
                p = (p + 1) % m;
            }
        } else if (op == "-") {
            int p = k % m;
            int found = -1;
            for (int step = 0; step < m; step++) {
                if (table[p] == -1) break;
                if (table[p] == k) { found = p; break; }
                p = (p + 1) % m;
            }
            if (found < 0) continue;
            table[found] = -1;
            int hole = found;
            int j = (found + 1) % m;
            while (table[j] != -1) {
                int hk = table[j] % m;
                int dHole = (hole - hk + m) % m;
                int dJ = (j - hk + m) % m;
                if (dHole < dJ) { table[hole] = table[j]; table[j] = -1; hole = j; }
                j = (j + 1) % m;
                if (j == hole) break;
            }
        }
    }
    for (int i = 0; i < m; i++) cout << table[i] << " \n"[i + 1 == m];
    return 0;
}
