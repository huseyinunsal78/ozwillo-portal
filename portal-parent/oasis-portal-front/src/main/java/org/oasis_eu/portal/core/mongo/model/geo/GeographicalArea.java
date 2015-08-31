package org.oasis_eu.portal.core.mongo.model.geo;

import java.util.List;

import org.joda.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Document(collection = "geographical_area")
@CompoundIndexes({
        @CompoundIndex(name = "lang_nametokens", def = "{'lang':1, 'nameTokens':1}"),
        @CompoundIndex(name = "lang_nametokens_country", def = "{'lang':1, 'nameTokens':1, country:1}")
})
public class GeographicalArea {

    @Id
    private String id;

    /** language used for the name */
    private String lang;

    /** displayed ; in current locale */
    @JsonProperty
    private String name;

    /** to constraint search within this mixin or model type
     * TODO fill, index, query criteria */
    private List<String> modelType;

    // LATER OPT to search within one type on several fields, either add their values to tokenization
    // (provides a single autocompletion form field), or (to have one autocompletion form field
    // per Datacore field) configure one separate fulltext index i.e. one mongo collection per
    // Datacore field to look up in.

    /** to help the user discriminate, built using names of NUTS3 or else 2 parent with country
     * @obsolete using name instead */
    @Field("detailed_name")
    @JsonProperty
    private String detailedName;

    @JsonProperty
    private List<String> ancestors;

    private List<String> nameTokens;

    @JsonProperty
    private String country;


    /** URI in Datacore (required if ex. sending directly to store ajax) */
    @JsonProperty
    private String uri;

    @JsonIgnore
    @Indexed
    private GeographicalAreaReplicationStatus status = GeographicalAreaReplicationStatus.INCOMING;

    @JsonIgnore
    private Instant replicationTime = Instant.now();

    public GeographicalArea() {
        
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getModelType() {
        return modelType;
    }

    public void setModelType(List<String> modelType) {
        this.modelType = modelType;
    }

    public String getDetailedName() {
        return detailedName;
    }

    public void setDetailedName(String detailedName) {
        this.detailedName = detailedName;
    }

    public String getUri() {
        return uri;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String lang) {
        this.lang = lang;
    }

    public GeographicalAreaReplicationStatus getStatus() {
        return status;
    }

    public void setStatus(GeographicalAreaReplicationStatus status) {
        this.status = status;
    }

    public Instant getReplicationTime() {
        return replicationTime;
    }

    public void setReplicationTime(Instant replicationTime) {
        this.replicationTime = replicationTime;
    }

    public List<String> getNameTokens() {
        return nameTokens;
    }

    public void setNameTokens(List<String> nameTokens) {
        this.nameTokens = nameTokens;
    }

    public List<String> getAncestors() {
        return ancestors;
    }

    public void setAncestors(List<String> ancestors) {
        this.ancestors = ancestors;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

}
