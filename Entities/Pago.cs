using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("pago")]
    public class Pago : BaseModel
    {
        [PrimaryKey("id_pago", true)]
        [JsonPropertyName("ID_Pago")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int IdPago { get; set; }

        [Column("id_factura")]
        [JsonPropertyName("ID_Factura")]
        public int IdFactura { get; set; }

        [Column("fecha_pago")]
        [JsonPropertyName("Fecha_Pago")]
        public DateTime? FechaPago { get; set; }

        [Column("monto_pago")]
        [JsonPropertyName("Monto_Pago")]
        public decimal MontoPago { get; set; }

        [Column("estado_pago")]
        [JsonPropertyName("Estado_Pago")]
        public string EstadoPago { get; set; } = string.Empty;
    }
}
