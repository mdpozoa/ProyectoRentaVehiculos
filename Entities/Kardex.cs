using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("kardex")]
    public class Kardex : BaseModel
    {
        [PrimaryKey("id_kardex", false)]
        [JsonPropertyName("ID_Kardex")]
        public int IdKardex { get; set; }

        [Column("id_vehiculo")]
        [JsonPropertyName("ID_Vehiculo")]
        public int IdVehiculo { get; set; }

        [Column("fecha_movimiento_kardex")]
        [JsonPropertyName("Fecha_Movimiento_Kardex")]
        public DateTime FechaMovimientoKardex { get; set; }

        [Column("tipo_movimiento_kardex")]
        [JsonPropertyName("Tipo_Movimiento_Kardex")]
        public string TipoMovimientoKardex { get; set; } = string.Empty;

        [Column("kilometraje_kardex")]
        [JsonPropertyName("Kilometraje_Kardex")]
        public decimal KilometrajeKardex { get; set; }

        [Column("observaciones_kardex")]
        [JsonPropertyName("Observaciones_Kardex")]
        public string ObservationsKardex { get; set; } = string.Empty; // Fixed typo in property name if any, but keeping consistency
    }
}
