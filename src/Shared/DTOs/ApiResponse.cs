namespace Shared.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string[]? Errors { get; set; }

    public static ApiResponse<T> Ok(T data) =>
        new() { Success = true, Data = data };

    public static ApiResponse<T> Fail(string message, string[]? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}

public class PagedApiResponse<T>
{
    public bool Success { get; set; }
    public IEnumerable<T>? Data { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }

    public static PagedApiResponse<T> Ok(IEnumerable<T> data, int page, int pageSize, int total) =>
        new() { Success = true, Data = data, Page = page, PageSize = pageSize, Total = total };
}
