using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace Shared.Entities;

[Table("factura")]
public class Factura : BaseModel
{
    [PrimaryKey("id_factura", false)]
    [JsonPropertyName("ID_Factura")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdFactura { get; set; }

    [Column("id_contrato")] [JsonPropertyName("ID_Contrato")]
    public int IdContrato { get; set; }

    [Column("id_usuario")] [JsonPropertyName("ID_Usuario")]
    public int IdUsuario { get; set; }

    [Column("numero_factura")] [JsonPropertyName("Numero_Factura")]
    public string NumeroFactura { get; set; } = string.Empty;

    [Column("f_emision_factura")] [JsonPropertyName("F_Emision_Factura")]
    public DateTime? FEmisionFactura { get; set; }

    [Column("subtotal_factura")] [JsonPropertyName("Subtotal_Factura")]
    public decimal SubtotalFactura { get; set; }

    [Column("iva_factura")] [JsonPropertyName("IVA_Factura")]
    public decimal IvaFactura { get; set; }

    [Column("total_factura")] [JsonPropertyName("Total_Factura")]
    public decimal TotalFactura { get; set; }

    [Column("m_pago_factura")] [JsonPropertyName("M_Pago_Factura")]
    public string MPagoFactura { get; set; } = string.Empty;
}

[Table("detalle_factura")]
public class DetalleFactura : BaseModel
{
    [PrimaryKey("id_detalle", false)]
    [JsonPropertyName("ID_Detalle")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdDetalle { get; set; }

    [Column("id_factura")] [JsonPropertyName("ID_Factura")]
    public int IdFactura { get; set; }

    [Column("descripcion_detalle")] [JsonPropertyName("Descripcion_Detalle")]
    public string DescripcionDetalle { get; set; } = string.Empty;

    [Column("cantidad_detalle")] [JsonPropertyName("Cantidad_Detalle")]
    public int CantidadDetalle { get; set; }

    [Column("precio_unitario_detalle")] [JsonPropertyName("Precio_Unitario_Detalle")]
    public decimal PrecioUnitarioDetalle { get; set; }

    [Column("subtotal_detalle")] [JsonPropertyName("Subtotal_Detalle")]
    public decimal SubtotalDetalle { get; set; }
}

[Table("pago")]
public class Pago : BaseModel
{
    [PrimaryKey("id_pago", false)]
    [JsonPropertyName("ID_Pago")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdPago { get; set; }

    [Column("id_factura")] [JsonPropertyName("ID_Factura")]
    public int IdFactura { get; set; }

    [Column("fecha_pago")] [JsonPropertyName("Fecha_Pago")]
    public DateTime? FechaPago { get; set; }

    [Column("monto_pago")] [JsonPropertyName("Monto_Pago")]
    public decimal MontoPago { get; set; }

    [Column("estado_pago")] [JsonPropertyName("Estado_Pago")]
    public string EstadoPago { get; set; } = "Pendiente";
}

[Table("auditoria")]
public class Auditoria : BaseModel
{
    [PrimaryKey("id_auditoria", false)]
    [JsonPropertyName("ID_Auditoria")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int? IdAuditoria { get; set; }

    [Column("id_usuario")] [JsonPropertyName("ID_Usuario")]
    public int IdUsuario { get; set; }

    [Column("accion_auditoria")] [JsonPropertyName("Accion_Auditoria")]
    public string AccionAuditoria { get; set; } = string.Empty;

    [Column("fecha_auditoria")] [JsonPropertyName("Fecha_Auditoria")]
    public DateTime? FechaAuditoria { get; set; }
}
