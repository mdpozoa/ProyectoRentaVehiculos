using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("factura")]
    public class Factura : BaseModel
    {
        [PrimaryKey("id_factura", true)]
        [JsonPropertyName("ID_Factura")]
        public int IdFactura { get; set; }

        [Column("id_contrato")]
        [JsonPropertyName("ID_Contrato")]
        public int IdContrato { get; set; }

        [Column("id_usuario")]
        [JsonPropertyName("ID_Usuario")]
        public int IdUsuario { get; set; }

        [Column("numero_factura")]
        [JsonPropertyName("Numero_Factura")]
        public string NumeroFactura { get; set; } = string.Empty;

        [Column("f_emision_factura")]
        [JsonPropertyName("F_Emision_Factura")]
        public DateTime? FEmisionFactura { get; set; }

        [Column("subtotal_factura")]
        [JsonPropertyName("Subtotal_Factura")]
        public decimal SubtotalFactura { get; set; }

        [Column("iva_factura")]
        [JsonPropertyName("IVA_Factura")]
        public decimal IvaFactura { get; set; }

        [Column("total_factura")]
        [JsonPropertyName("Total_Factura")]
        public decimal TotalFactura { get; set; }

        [Column("m_pago_factura")]
        [JsonPropertyName("M_Pago_Factura")]
        public string MPagoFactura { get; set; } = string.Empty;
    }
}
