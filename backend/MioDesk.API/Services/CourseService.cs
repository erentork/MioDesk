using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Exceptions;
using MioDesk.API.Extensions;
using MioDesk.API.Repositories;

namespace MioDesk.API.Services;

public interface ICourseService
{
    Task<IReadOnlyList<CourseResponse>> GetAllAsync(Guid userId);
    Task<CourseResponse> CreateAsync(Guid userId, CourseRequest request);
    Task<CourseResponse> UpdateAsync(Guid userId, Guid id, CourseRequest request);
    Task DeleteAsync(Guid userId, Guid id);
}

public sealed class CourseService(ICourseRepository courses) : ICourseService
{
    public async Task<IReadOnlyList<CourseResponse>> GetAllAsync(Guid userId) => (await courses.GetAllAsync(userId)).Select(x => x.ToResponse()).ToList();

    public async Task<CourseResponse> CreateAsync(Guid userId, CourseRequest request)
    {
        Validate(request);
        var code = NormalizeCourseCode(request.Code);
        if (await courses.CodeExistsAsync(userId, code)) throw new AppException(409, "Bu ders kodu zaten kayıtlı.");

        var course = new Course { UserId = userId };
        Apply(course, request, code);
        await courses.SaveAsync(course);
        return course.ToResponse();
    }

    public async Task<CourseResponse> UpdateAsync(Guid userId, Guid id, CourseRequest request)
    {
        Validate(request);
        var course = await courses.GetAsync(userId, id) ?? throw new AppException(404, "Ders bulunamadı.");
        var code = NormalizeCourseCode(request.Code);
        if (await courses.CodeExistsAsync(userId, code, id)) throw new AppException(409, "Bu ders kodu zaten kayıtlı.");
        Apply(course, request, code);
        await courses.SaveAsync(course);
        return course.ToResponse();
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var course = await courses.GetAsync(userId, id) ?? throw new AppException(404, "Ders bulunamadı.");
        await courses.DeleteAsync(course);
    }

    private static void Apply(Course course, CourseRequest request, string code)
    {
        course.Name = request.Name.Trim();
        course.Code = code;
        course.Instructor = request.Instructor.Trim();
        course.Room = request.Room.Trim();
        course.Color = NormalizeColor(request.Color);
    }

    private static void Validate(CourseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new AppException(400, "Ders adı zorunludur.");
}

    private static string NormalizeColor(string color) =>
        !string.IsNullOrWhiteSpace(color) && color.StartsWith('#') && (color.Length == 7 || color.Length == 4) ? color : "#F7A8BA";
    private const string OptionalCourseCodePrefix = "~M";
    private const int OptionalCourseCodeLength = 16;

    private static string NormalizeCourseCode(string? code)
    {
        if (!string.IsNullOrWhiteSpace(code))
        {
            return code.Trim().ToUpperInvariant();
        }

        var randomPartLength =
            OptionalCourseCodeLength - OptionalCourseCodePrefix.Length;

        return OptionalCourseCodePrefix +
            Guid.NewGuid().ToString("N")[..randomPartLength];
    }
}
