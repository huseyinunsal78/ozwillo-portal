package org.oasis_eu.portal.front.my.network;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.validator.constraints.NotEmpty;
import org.oasis_eu.portal.model.network.UIOrganization;
import org.oasis_eu.portal.services.NetworkService;
import org.oasis_eu.spring.kernel.exception.ForbiddenException;
import org.oasis_eu.spring.kernel.exception.WrongQueryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.validation.Errors;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.List;

import static org.springframework.web.bind.annotation.RequestMethod.*;

/**
 * User: schambon
 * Date: 10/24/14
 */
@RestController
@RequestMapping("/my/api/network")
public class NetworkAJAXServices {

    private static final Logger logger = LoggerFactory.getLogger(NetworkAJAXServices.class);

    @Value("${application.devmode:false}")
    private boolean devmode;

    @Autowired
    private NetworkService networkService;

    @RequestMapping(value = "/organizations", method = GET)
    public List<UIOrganization> organizations() {
        List<UIOrganization> organizations = networkService.getMyOrganizations();

        logger.debug("Found organizations: {}", organizations);
        return organizations;
    }

    @RequestMapping(value = "/organization/{organizationId}", method = POST)
    public void updateOrganization(@RequestBody @Valid UIOrganization organization, Errors errors) {
        logger.debug("Updating organization {}", organization);

        networkService.updateOrganization(organization);
    }

    @RequestMapping(value = "/invite/{organizationId}", method = POST)
    public void invite(@PathVariable String organizationId, @RequestBody @Valid InvitationRequest invitation, Errors errors) {
        logger.debug("Inviting {} to organization {}", invitation.email, organizationId);

        if (errors.hasErrors()) {
            throw new WrongQueryException();
        }

        networkService.invite(invitation.email, organizationId);

    }

    @RequestMapping(value = "/leave", method = POST)
    public void leave(@RequestBody @Valid LeaveRequest request) {
        logger.debug("Leaving {}", request.organization);

        networkService.leave(request.organization);
    }

    @RequestMapping(value = "/create-organization", method = POST)
    public void createOrganization(@RequestBody CreateOrganizationRequest createOrganizationRequest) {
        logger.debug("Creating organization {} of type {}", createOrganizationRequest.name, createOrganizationRequest.type);

        networkService.createOrganization(createOrganizationRequest.name, createOrganizationRequest.type);
    }

    @RequestMapping(value = "/organization/{organizationId}", method = DELETE)
    public void deleteOrganization(@PathVariable String organizationId) {
        if (!devmode) {
            logger.error("Request to delete organization while not in devmode");
            throw new ForbiddenException();
        }

        logger.debug("Deleting organization {}", organizationId);
        networkService.deleteOrganization(organizationId);
    }

    @ExceptionHandler(WrongQueryException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public void handleErrors() {

    }

    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public void hande403() {

    }

    public static class InvitationRequest {
        @JsonProperty
        @NotNull
        @NotEmpty
        String email;
    }

    public static class LeaveRequest {
        @JsonProperty
        @NotNull
        @NotEmpty
        String organization;
    }

    public static class CreateOrganizationRequest {
        @JsonProperty
        @NotNull
        @NotEmpty
        String name;
        @JsonProperty
        @NotNull
        @NotEmpty
        String type;
    }
}
