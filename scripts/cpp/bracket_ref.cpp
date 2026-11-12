// 括号匹配参考（批量模式）：N + N 行括号串 → 每行输出 MATCH / NO
#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    while (n--) {
        string s;
        cin >> s;
        stack<char> st;
        bool ok = true;
        for (char c : s) {
            if (c == '(' || c == '[' || c == '{') st.push(c);
            else {
                if (st.empty()) { ok = false; break; }
                char t = st.top();
                if ((c == ')' && t == '(') || (c == ']' && t == '[') || (c == '}' && t == '{')) st.pop();
                else { ok = false; break; }
            }
        }
        if (!st.empty()) ok = false;
        cout << (ok ? "MATCH" : "NO") << "\n";
    }
    return 0;
}
