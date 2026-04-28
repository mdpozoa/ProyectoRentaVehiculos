using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using System.Text.Json.Serialization;

namespace ProyectoRentaVehiculos.Entities
{
    [Table("categoria")]
    public class Categoria : BaseModel
    {
        [PrimaryKey("id_categoria", true)]
        [JsonPropertyName("ID_Categoria")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int? IdCategoria { get; set; }

        [Column("nombre_categoria")]
        [JsonPropertyName("Nombre_Categoria")]
        public string NombreCategoria { get; set; } = string.Empty;

        [Column("descripcion_categoria")]
        [JsonPropertyName("Descripcion_Categoria")]
        public string DescripcionCategoria { get; set; } = string.Empty;
    }
}
