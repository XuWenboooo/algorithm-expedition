// 并查集参考（路径压缩 + 按大小合并）：n + 操作数 + 操作(+a b / ?a b) → 每查询 1/0 + 最终组数
#include <bits/stdc++.h>
using namespace std;

struct DSU {
    vector<int> fa, sz;
    DSU(int n) : fa(n + 1), sz(n + 1, 1) { for (int i = 0; i <= n; i++) fa[i] = i; }
    int find(int x) { while (fa[x] != x) x = fa[x] = fa[fa[x]]; return x; }
    bool unite(int a, int b) {
        a = find(a); b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        fa[b] = a; sz[a] += sz[b];
        return true;
    }
};

int main() {
    int n, q;
    cin >> n >> q;
    DSU dsu(n);
    while (q--) {
        string op; int a, b;
        cin >> op >> a >> b;
        if (op == "+") dsu.unite(a, b);
        else cout << (dsu.find(a) == dsu.find(b) ? 1 : 0) << "\n";
    }
    int groups = 0;
    for (int i = 1; i <= n; i++) if (dsu.find(i) == i) groups++;
    cout << groups << "\n";
    return 0;
}
