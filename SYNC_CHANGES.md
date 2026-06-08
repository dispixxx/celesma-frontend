# Frontend Sync - Изменения

## Обновления для синхронизации с backend API

### Изменения в типах (`src/types/index.ts`)

1. **UserSummary** - добавлено поле `role`
2. **ProjectResponse** - удалены поля:
   - `memberCount` (рассчитывается через `members.length`)
   - `currentUserRole` (рассчитывается на клиенте)
   - `isApplicant` (рассчитывается на клиенте)

3. **MemberDto** - удалено поле `isOwner` (сравнивается через `owner.username`)

4. **ApplicantResponse** - новый тип:
   ```typescript
   {
     projectId: number;
     user: UserSummary;
     requestAt: string;
   }
   ```

5. **TaskRequest** - `assigneeId` теперь может быть `null`

### API изменения (`src/api/projects.ts`)

- `join`: `/projects/{id}/applicants/join` (POST)
- `cancelJoin`: `/projects/{id}/applicants/separate` (DELETE)
- `acceptApplicant`: без изменений
- `declineApplicant`: `/projects/{id}/applicants/{userId}/decline` (DELETE)
- `updateMemberRole`: body = `{ projectId, role }`
- Удалено: `exit` метод

### Новые утилиты (`src/utils/projectUtils.ts`)

```typescript
getCurrentUserRole(project, username) // вычисляет роль пользователя
isProjectMember(project, username)    // проверяет участие
getMemberCount(project)                // возвращает количество
isOwner(project, username)             // проверяет владельца
isApplicant(applicants, username)      // проверяет заявку
```

### Обновленные страницы

- `ProjectsPage.tsx` - использует утилиты
- `ProjectViewPage.tsx` - загружает аппликантов, использует утилиты
- `ProjectSettingsPage.tsx` - работает с `ApplicantResponse`
- `ProjectSearchPage.tsx` - использует утилиты
- `useProjectRole.ts` - хук использует утилиты

## Запуск

```bash
npm install
npm run dev
```

Frontend будет работать на `http://localhost:3000`
Backend должен быть запущен на `http://localhost:8080`
