using System.Text.Json.Serialization;

namespace Shared.DTOs;

/// <summary>Contrato vehiculos-api.yaml → VehiculoDto</summary>
public class VehiculoDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = string.Empty;          // "Toyota Corolla"

    [JsonPropertyName("descripcion")]
    public string Descripcion { get; set; } = string.Empty;

    [JsonPropertyName("precioPorDia")]
    public decimal PrecioPorDia { get; set; }

    [JsonPropertyName("moneda")]
    public string Moneda { get; set; } = "USD";

    [JsonPropertyName("categoria")]
    public string Categoria { get; set; } = string.Empty;

    [JsonPropertyName("disponible")]
    public bool Disponible { get; set; }

    [JsonPropertyName("imagenUrl")]
    public string? ImagenUrl { get; set; }

    // Campos adicionales BFF (no en el YAML estricto pero útiles para el frontend)
    [JsonPropertyName("placa")]
    public string? Placa { get; set; }

    [JsonPropertyName("anio")]
    public int? Anio { get; set; }

    [JsonPropertyName("color")]
    public string? Color { get; set; }

    [JsonPropertyName("combustible")]
    public string? Combustible { get; set; }

    [JsonPropertyName("kilometraje")]
    public decimal? Kilometraje { get; set; }

    [JsonPropertyName("transmision")]
    public string? Transmision { get; set; }

    [JsonPropertyName("marca")]
    public string? Marca { get; set; }

    [JsonPropertyName("agenciaId")]
    public int? AgenciaId { get; set; }
}

public class DisponibilidadVehiculoDto
{
    [JsonPropertyName("disponible")]
    public bool Disponible { get; set; }

    [JsonPropertyName("mensaje")]
    public string Mensaje { get; set; } = string.Empty;
}
