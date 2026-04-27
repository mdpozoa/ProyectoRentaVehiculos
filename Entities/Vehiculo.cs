using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("vehiculo")]
    public class Vehiculo : BaseModel
    {
        [PrimaryKey("id_vehiculo", false)]
        [JsonPropertyName("ID_Vehiculo")]
        public int IdVehiculo { get; set; }

        [Column("id_modelo")]
        [JsonPropertyName("ID_Modelo")]
        public int IdModelo { get; set; }

        [Column("id_categoria")]
        [JsonPropertyName("ID_Categoria")]
        public int IdCategoria { get; set; }

        [Column("id_agencia_actual")]
        [JsonPropertyName("ID_Agencia_Actual")]
        public int IdAgenciaActual { get; set; }

        [Column("placa_vehiculo")]
        [JsonPropertyName("Placa_Vehiculo")]
        public string PlacaVehiculo { get; set; } = string.Empty;

        [Column("color_vehiculo")]
        [JsonPropertyName("Color_Vehiculo")]
        public string ColorVehiculo { get; set; } = string.Empty;

        [Column("anio_vehiculo")]
        [JsonPropertyName("Anio_Vehiculo")]
        public int AnioVehiculo { get; set; }
        
        [Column("kilometraje_vehiculo")]
        [JsonPropertyName("Kilometraje_Vehiculo")]
        public decimal KilometrajeVehiculo { get; set; }

        [Column("combustible_vehiculo")]
        [JsonPropertyName("Combustible_Vehiculo")]
        public string CombustibleVehiculo { get; set; } = string.Empty;

        [Column("estado_vehiculo")]
        [JsonPropertyName("Estado_Vehiculo")]
        public string EstadoVehiculo { get; set; } = string.Empty;

        [Column("fecha_registro")]
        [JsonPropertyName("Fecha_Registro")]
        public DateTime? FechaRegistro { get; set; }
    }
}
