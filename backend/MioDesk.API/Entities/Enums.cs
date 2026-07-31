namespace MioDesk.API.Entities;

public enum AcademicTaskType
{
    Assignment = 0,
    ProjectExam = 1,
    Presentation = 2,
    Quiz = 3,
    PersonalTask = 4
}

public enum AcademicTaskStatus
{
    NotStarted = 0,
    InProgress = 1,
    Completed = 2,
    Submitted = 3
}

public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

public enum NotificationKind
{
    Info = 0,
    Reminder = 1,
    Success = 2,
    Warning = 3
}
