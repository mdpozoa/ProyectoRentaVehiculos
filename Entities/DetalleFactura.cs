using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("detalle_factura")]
    public class DetalleFactura : BaseModel
    {
        [PrimaryKey("id_detalle", true)]
        [JsonPropertyName("ID_Detalle")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int IdDetalle { get; set; }

        [Column("id_factura")]
        [JsonPropertyName("ID_Factura")]
        public int IdFactura { get; set; }

        [Column("descripcion_detalle")]
        [JsonPropertyName("Descripcion_Detalle")]
        public string DescripcionDetalle { get; set; } = string.Empty;

        [Column("cantidad_detalle")]
        [JsonPropertyName("Cantidad_Detalle")]
        public int CantidadDetalle { get; set; }

        [Column("precio_unitario_detalle")]
        [JsonPropertyName("Precio_Unitario_Detalle")]
        public decimal PrecioUnitarioDetalle { get; set; }

        [Column("subtotal_detalle")]
        [JsonPropertyName("Subtotal_Detalle")]
        public decimal SubtotalDetalle { get; set; }
    }
}
