using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("siniestro")]
    public class Siniestro : BaseModel
    {
        [PrimaryKey("id_siniestro", false)]
        [JsonPropertyName("ID_Siniestro")]
        public int IdSiniestro { get; set; }

        [Column("id_reserva")]
        [JsonPropertyName("ID_Reserva")]
        public int IdReserva { get; set; }

        [Column("id_vehiculo")]
        [JsonPropertyName("ID_Vehiculo")]
        public int IdVehiculo { get; set; }

        [Column("fecha_siniestro")]
        [JsonPropertyName("Fecha_Siniestro")]
        public DateTime FechaSiniestro { get; set; }

        [Column("tipo_siniestro")]
        [JsonPropertyName("Tipo_Siniestro")]
        public string TipoSiniestro { get; set; } = string.Empty;

        [Column("descripcion_siniestro")]
        [JsonPropertyName("Descripcion_Siniestro")]
        public string DescripcionSiniestro { get; set; } = string.Empty;

        [Column("monto_estimado")]
        [JsonPropertyName("Monto_Estimado")]
        public decimal MontoEstimado { get; set; }

        [Column("costo_siniestro")]
        [JsonPropertyName("Costo_Siniestro")]
        public decimal? CostoSiniestro { get; set; }
    }
}
