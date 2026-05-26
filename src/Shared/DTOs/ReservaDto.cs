using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace Shared.DTOs;

/// <summary>Request para crear reserva — vehiculos-api.yaml → ReservaRequestDto</summary>
public class ReservaRequestDto
{
    [Required]
    [JsonPropertyName("vehiculoId")]
    public string VehiculoId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("clienteId")]
    public string ClienteId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("fechaInicio")]
    public DateOnly FechaInicio { get; set; }

    [Required]
    [JsonPropertyName("fechaFin")]
    public DateOnly FechaFin { get; set; }

    [JsonPropertyName("agenciaId")]
    public string? AgenciaId { get; set; }
}

/// <summary>Response de reserva — vehiculos-api.yaml → ReservaDto</summary>
public class ReservaDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("estado")]
    public string Estado { get; set; } = string.Empty;

    [JsonPropertyName("total")]
    public decimal Total { get; set; }

    [JsonPropertyName("vehiculoId")]
    public string? VehiculoId { get; set; }

    [JsonPropertyName("clienteId")]
    public string? ClienteId { get; set; }

    [JsonPropertyName("fechaInicio")]
    public DateTime? FechaInicio { get; set; }

    [JsonPropertyName("fechaFin")]
    public DateTime? FechaFin { get; set; }
}

/// <summary>vehiculos-api.yaml → AlquilerRequestDto</summary>
public class AlquilerRequestDto
{
    [Required]
    [JsonPropertyName("reservaId")]
    public string ReservaId { get; set; } = string.Empty;

    [Required]
    [JsonPropertyName("kmSalida")]
    public int KmSalida { get; set; }
}

/// <summary>vehiculos-api.yaml → DevolucionRequestDto</summary>
public class DevolucionRequestDto
{
    [Required]
    [JsonPropertyName("alquilerId")]
    public string AlquilerId { get; set; } = string.Empty;

    [JsonPropertyName("kmEntrada")]
    public int KmEntrada { get; set; }

    [JsonPropertyName("cargoExtra")]
    public decimal CargoExtra { get; set; }
}

public class UpdateEstadoDto
{
    [JsonPropertyName("estado")]
    public string Estado { get; set; } = string.Empty;
}
