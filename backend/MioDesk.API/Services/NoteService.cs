using MioDesk.API.DTOs;
using MioDesk.API.Entities;
using MioDesk.API.Exceptions;
using MioDesk.API.Extensions;
using MioDesk.API.Repositories;

namespace MioDesk.API.Services;

public interface INoteService
{
    Task<IReadOnlyList<NoteResponse>> GetAllAsync(Guid userId);
    Task<NoteResponse> CreateAsync(Guid userId, NoteRequest request);
    Task<NoteResponse> UpdateAsync(Guid userId, Guid id, NoteRequest request);
    Task DeleteAsync(Guid userId, Guid id);
}

public sealed class NoteService(INoteRepository notes, ICourseRepository courses) : INoteService
{
    public async Task<IReadOnlyList<NoteResponse>> GetAllAsync(Guid userId) => (await notes.GetAllAsync(userId)).Select(x => x.ToResponse()).ToList();

    public async Task<NoteResponse> CreateAsync(Guid userId, NoteRequest request)
    {
        await ValidateCourseAsync(userId, request.CourseId);
        Validate(request);
        var note = new CourseNote { UserId = userId };
        Apply(note, request);
        await notes.SaveAsync(note);
        note = await notes.GetAsync(userId, note.Id) ?? note;
        return note.ToResponse();
    }

    public async Task<NoteResponse> UpdateAsync(Guid userId, Guid id, NoteRequest request)
    {
        var note = await notes.GetAsync(userId, id) ?? throw new AppException(404, "Not bulunamadı.");
        await ValidateCourseAsync(userId, request.CourseId);
        Validate(request);
        Apply(note, request);
        await notes.SaveAsync(note);
        note = await notes.GetAsync(userId, note.Id) ?? note;
        return note.ToResponse();
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var note = await notes.GetAsync(userId, id) ?? throw new AppException(404, "Not bulunamadı.");
        await notes.DeleteAsync(note);
    }

    private async Task ValidateCourseAsync(Guid userId, Guid? courseId)
    {
        if (courseId.HasValue && await courses.GetAsync(userId, courseId.Value) is null)
            throw new AppException(404, "Ders bulunamadı.");
    }

    private static void Validate(NoteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) throw new AppException(400, "Not başlığı zorunludur.");
        if (string.IsNullOrWhiteSpace(request.Content)) throw new AppException(400, "Not içeriği zorunludur.");
    }

    private static void Apply(CourseNote note, NoteRequest request)
    {
        note.Title = request.Title.Trim();
        note.Content = request.Content.Trim();
        note.Color = string.IsNullOrWhiteSpace(request.Color) ? "#FFF1A8" : request.Color;
        note.IsPinned = request.IsPinned;
        note.IsImportant = request.IsImportant;
        note.SortOrder = request.SortOrder;
        note.CourseId = request.CourseId;
    }
}
