using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("tarifa")]
    public class Tarifa : BaseModel
    {
        [PrimaryKey("id_tarifa", false)]
        [JsonPropertyName("ID_Tarifa")]
        public int IdTarifa { get; set; }

        [Column("id_categoria")]
        [JsonPropertyName("ID_Categoria")]
        public int IdCategoria { get; set; }

        [Column("v_diario_tarifa")]
        [JsonPropertyName("V_Diario_Tarifa")]
        public decimal VDiarioTarifa { get; set; }

        [Column("v_seguro_tarifa")]
        [JsonPropertyName("V_Seguro_Tarifa")]
        public decimal VSeguroTarifa { get; set; }

        [Column("fv_inicio_tarifa")]
        [JsonPropertyName("FV_Inicio_Tarifa")]
        public DateTime FVInicioTarifa { get; set; }

        [Column("fv_final_tarifa")]
        [JsonPropertyName("FV_Final_Tarifa")]
        public DateTime? FVFinalTarifa { get; set; }
    }
}
