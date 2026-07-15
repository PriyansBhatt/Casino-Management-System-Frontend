import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/layout/PageHeader'
import Alert from '../../components/ui/Alert'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { TEST_CHECKLIST_GROUPS, getChecklistItemId } from '../../constants/testChecklist'

const storageKey = 'casino_manual_test_checklist_progress'

const readProgress = () => {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : {}
  } catch (error) {
    console.error('Failed to read test checklist progress:', error)
    return {}
  }
}

const TestChecklist = () => {
  const [checkedItems, setCheckedItems] = useState({})

  useEffect(() => {
    setCheckedItems(readProgress())
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checkedItems))
    } catch (error) {
      console.error('Failed to save test checklist progress:', error)
    }
  }, [checkedItems])

  const allItemIds = useMemo(
    () =>
      TEST_CHECKLIST_GROUPS.flatMap((group) =>
        group.items.map((_, itemIndex) => getChecklistItemId(group.id, itemIndex))
      ),
    []
  )

  const completedCount = allItemIds.filter((id) => checkedItems[id]).length
  const totalCount = allItemIds.length
  const remainingCount = totalCount - completedCount
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const toggleItem = (itemId) => {
    setCheckedItems((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }))
  }

  const resetChecklist = () => {
    setCheckedItems({})
  }

  const markAllComplete = () => {
    setCheckedItems(
      allItemIds.reduce((progress, itemId) => ({ ...progress, [itemId]: true }), {})
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Frontend Test Checklist"
        description="Manual demo readiness checklist for the Casino Management System frontend."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={resetChecklist}>Reset Checklist</Button>
            <Button onClick={markAllComplete}>Mark All Complete</Button>
          </div>
        }
      />

      <Alert variant="info" title="Manual Testing Note">
        This checklist is for frontend demo/manual testing only. Backend integration testing will be
        required separately.
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-gray-500">Completed Tests</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{completedCount}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500">Remaining Tests</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{remainingCount}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-gray-500">Completion</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{completionPercentage}%</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-blue-600"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <div className="space-y-2 text-sm text-amber-900">
          <p>Always test transactions crossing midnight using Business Date logic.</p>
          <p>Losing return must use net verified customer loss, not gross buy-in.</p>
          <p>Table module tracks table sessions/totals, not individual players.</p>
          <p>System Lock must block sensitive actions.</p>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {TEST_CHECKLIST_GROUPS.map((group) => {
          const groupIds = group.items.map((_, itemIndex) => getChecklistItemId(group.id, itemIndex))
          const groupCompleted = groupIds.filter((id) => checkedItems[id]).length

          return (
            <Card key={group.id}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {groupCompleted} of {group.items.length} checks complete
                  </p>
                </div>
                <Badge variant={groupCompleted === group.items.length ? 'success' : 'info'}>
                  {Math.round((groupCompleted / group.items.length) * 100)}%
                </Badge>
              </div>

              <div className="space-y-3">
                {group.items.map((item, itemIndex) => {
                  const itemId = getChecklistItemId(group.id, itemIndex)
                  return (
                    <label
                      key={itemId}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checkedItems[itemId])}
                        onChange={() => toggleItem(itemId)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-800">{item}</span>
                    </label>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default TestChecklist
