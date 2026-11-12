// 拓扑排序参考（Kahn）：n m + m 行 u v → 拓扑序（一行）或 "CYCLE"
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        indeg[v]++;
    }
    queue<int> q;
    for (int i = 1; i <= n; i++) if (indeg[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            indeg[v]--;
            if (indeg[v] == 0) q.push(v);
        }
    }
    if ((int)order.size() < n) { cout << "CYCLE\n"; return 0; }
    for (int i = 0; i < n; i++) cout << order[i] << " \n"[i + 1 == n];
    return 0;
}
