// 小根堆参考：操作数 + 操作(+k / -1) → 每次弹出输出（空堆 -1）+ 最终剩余多重集（升序）
#include <bits/stdc++.h>
using namespace std;
int main() {
    int q;
    cin >> q;
    priority_queue<int, vector<int>, greater<int>> pq;
    while (q--) {
        string op;
        cin >> op;
        if (op[0] == '+') {
            pq.push(stoi(op.substr(1)));
        } else {
            if (pq.empty()) cout << -1 << "\n";
            else { cout << pq.top() << "\n"; pq.pop(); }
        }
    }
    vector<int> rest;
    while (!pq.empty()) { rest.push_back(pq.top()); pq.pop(); }
    if (rest.empty()) cout << "EMPTY\n";
    else for (size_t i = 0; i < rest.size(); i++) cout << rest[i] << " \n"[i + 1 == rest.size()];
    return 0;
}
