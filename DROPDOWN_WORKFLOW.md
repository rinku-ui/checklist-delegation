
# Dropdown Data Workflow

This diagram illustrates how data flows from the Supabase database to the React frontend components for the assignment dropdowns.

```mermaid
graph TD
    subgraph Frontend [React Component (QuickTask.jsx)]
        A[useEffect Hook] -->|Calls API Functions| B{API Layer}
        B -->|returns departments| C[setDepartments]
        B -->|returns givenByList| D[setGivenByList]
        B -->|returns doersList| E[setDoersList]
        C --> F[Dropdown: Department]
        D --> G[Dropdown: Given By]
        E --> H[Dropdown: Name / Doer]
    end

    subgraph API [API Layer (assignTaskApi.js)]
        B1[fetchUniqueDepartmentDataApi]
        B2[fetchUniqueGivenByDataApi]
        B3[fetchUniqueDoerNameDataApi]
    end

    subgraph Database [Supabase Database]
        DB1[(Users Table)]
        DB2[(Assign_From Table)]
    end

    %% Connections
    B -- Call Dept Data --> B1
    B -- Call GivenBy Data --> B2
    B -- Call Doer Data --> B3

    B1 -->|SELECT user_access FROM users WHERE status='active'| DB1
    DB1 -->|Raw Data: 'IT, HR', 'Sales'| B1
    B1 -->|Process: Unique & Sort| B

    B2 -->|SELECT name FROM assign_from| DB2
    DB2 -->|Raw Data: 'Manager A', 'CEO'| B2
    B2 -->|Return List| B

    B3 -->|SELECT user_name FROM users WHERE user_access ILIKE %dept%| DB1
    DB1 -->|Raw Data: 'User A', 'User B'| B3
    B3 -->|Return List| B

    style Frontend fill:#e1f5fe,stroke:#01579b
    style API fill:#fff3e0,stroke:#e65100
    style Database fill:#e8f5e9,stroke:#1b5e20
```
