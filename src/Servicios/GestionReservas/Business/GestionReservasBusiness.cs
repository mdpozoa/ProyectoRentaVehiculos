using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Shared.Entities;
using Shared.DTOs;
using GestionReservas.DataAccess;

namespace GestionReservas.Business;

public class AuthBusiness(AuthDA authDA, IConfiguration config)
{
    public async Task<(string Token, string Rol, int IdUsuario)> Login(string user, string pass)
    {
        var usuario = await authDA.LoginAsync(user, pass)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("id",       usuario.IdUsuario.ToString()!),
            new Claim("username", usuario.UserUsuario!),
            new Claim("rol",      usuario.RolUsuario!),
            new Claim("scope",    usuario.RolUsuario == "Admin"
                ? "admin vehiculos:read reservas:write reservas:read facturacion:read facturacion:write"
                : "vehiculos:read reservas:write reservas:read facturacion:read")
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"], audience: config["Jwt:Audience"],
            claims: claims, expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), usuario.RolUsuario!, usuario.IdUsuario!.Value);
    }
}

public class ReservaBusiness(ReservaDA reservaDA, IHttpClientFactory httpFactory, ILogger<ReservaBusiness> logger)
{
    private async Task<bool> VehiculoDisponible(int vehiculoId, DateOnly inicio, DateOnly fin, string? authHeader)
    {
        try
        {
            var client = httpFactory.CreateClient("CatalogoVehiculos");
            if (!string.IsNullOrEmpty(authHeader))
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", authHeader);

            var url = $"/api/v1/vehiculos/{vehiculoId}/disponibilidad?fechaInicio={inicio:yyyy-MM-dd}&fechaFin={fin:yyyy-MM-dd}";
            var resp = await client.GetAsync(url);
            if (!resp.IsSuccessStatusCode) return false;

            var json = await resp.Content.ReadFromJsonAsync<ApiResponse<DisponibilidadVehiculoDto>>();
            return json?.Data?.Disponible ?? false;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "No se pudo verificar disponibilidad en CatalogoVehiculos. Continuando con validación local.");
            return true; // fallback permisivo
        }
    }

    public async Task<List<Reserva>> GetAll()                         => await reservaDA.GetAll();
    public async Task<List<Reserva>> GetByUsuario(int id)             => await reservaDA.GetByUsuario(id);
    public async Task<Reserva?> GetById(int id)                       => await reservaDA.GetById(id);

    public async Task<Reserva?> CreateReserva(ReservaRequestDto dto, string? authHeader)
    {
        if (!int.TryParse(dto.VehiculoId, out var vehiculoId))
            throw new ArgumentException("vehiculoId inválido.");
        if (!int.TryParse(dto.ClienteId,  out var clienteId))
            throw new ArgumentException("clienteId inválido.");

        if (dto.FechaFin <= dto.FechaInicio)
            throw new ArgumentException("fechaFin debe ser posterior a fechaInicio.");

        var dias = (dto.FechaFin.DayNumber - dto.FechaInicio.DayNumber);
        if (dias > 7) throw new ArgumentException("La renta máxima es 7 días.");
        if (dto.FechaInicio < DateOnly.FromDateTime(DateTime.UtcNow.Date))
            throw new ArgumentException("fechaInicio no puede ser en el pasado.");

        var disponible = await VehiculoDisponible(vehiculoId, dto.FechaInicio, dto.FechaFin, authHeader);
        if (!disponible) throw new InvalidOperationException("El vehículo no está disponible para las fechas solicitadas.");

        var reserva = new Reserva
        {
            IdVehiculo     = vehiculoId,
            IdUsuario      = clienteId,
            IdAgencia      = dto.AgenciaId != null && int.TryParse(dto.AgenciaId, out var agId) ? agId : null,
            FechaReserva   = DateTime.UtcNow,
            FInicioReserva = dto.FechaInicio.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            FFinalReserva  = dto.FechaFin.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            EstadoReserva  = "Pendiente"
        };

        return await reservaDA.Create(reserva);
    }

    public async Task<Reserva?> UpdateEstado(int id, string estado)
    {
        var reserva = await reservaDA.GetById(id)
            ?? throw new KeyNotFoundException($"Reserva {id} no encontrada.");
        reserva.EstadoReserva = estado;
        return await reservaDA.Update(reserva);
    }

    public async Task DeleteReserva(int id)                           => await reservaDA.Delete(id);

    // Contratos
    public async Task<List<Contrato>> GetContratos()                  => await reservaDA.GetAllContratos();
    public async Task<Contrato?> GetContratoById(int id)              => await reservaDA.GetContratoById(id);
    public async Task<Contrato?> GetContratoByReserva(int id)         => await reservaDA.GetContratoByReserva(id);
    public async Task<Contrato?> CreateContrato(Contrato c)           => await reservaDA.CreateContrato(c);
    public async Task<Contrato?> UpdateContrato(Contrato c)           => await reservaDA.UpdateContrato(c);
    public async Task DeleteContrato(int id)                          => await reservaDA.DeleteContrato(id);
}

public class PersonaBusiness(PersonaDA da)
{
    public Task<List<Persona>> GetAll()         => da.GetAll();
    public Task<Persona?> GetById(int id)        => da.GetById(id);
    public Task<Persona?> GetByCedula(string c)  => da.GetByCedula(c);
    public Task<Persona?> Create(Persona p)      => da.Create(p);
    public Task<Persona?> Update(Persona p)      => da.Update(p);
    public Task Delete(int id)                   => da.Delete(id);
}

public class UsuarioBusiness(UsuarioDA da)
{
    public Task<List<Usuario>> GetAll()          => da.GetAll();
    public Task<Usuario?> GetById(int id)         => da.GetById(id);
    public async Task<Usuario?> Create(Usuario u)
    {
        u.FechaUsuario = DateTime.UtcNow;
        if (!u.PassUsuario.StartsWith("$2"))
            u.PassUsuario = BCrypt.Net.BCrypt.HashPassword(u.PassUsuario);
        return await da.Create(u);
    }
    public Task<Usuario?> Update(Usuario u)      => da.Update(u);
    public Task Delete(int id)                   => da.Delete(id);
}
