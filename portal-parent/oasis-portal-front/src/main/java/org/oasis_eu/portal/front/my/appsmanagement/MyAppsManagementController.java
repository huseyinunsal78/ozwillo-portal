package org.oasis_eu.portal.front.my.appsmanagement;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.oasis_eu.portal.front.generic.PortalController;
import org.oasis_eu.portal.model.MyNavigation;
import org.oasis_eu.portal.services.MyNavigationService;
import org.oasis_eu.portal.services.NetworkService;
import org.oasis_eu.portal.services.PortalAppManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.support.RequestContextUtils;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * User: schambon
 * Date: 7/29/14
 */

@Controller
@RequestMapping("/my/appsmanagement")
public class MyAppsManagementController extends PortalController {

    private static List<String> i18keys = Arrays.asList(
            "loading", "none", "manage_users", "users", "settings", "name", "actions",
            "settings-add-a-user", "description", "icon", "published");

    @Autowired
    private MyNavigationService navigationService;

    @Autowired
    private PortalAppManagementService appManagementService;

    @Autowired
    private NetworkService networkService;

    @Autowired
    private MessageSource messageSource;


    @ModelAttribute("navigation")
    public List<MyNavigation> getNavigation() {
        return navigationService.getNavigation("appsmanagement");
    }

    @ModelAttribute("i18n")
    public Map<String, String> getI18n(HttpServletRequest request) throws JsonProcessingException {
        Locale locale = RequestContextUtils.getLocale(request);

        return i18keys.stream().collect(Collectors.toMap(k -> k, k -> messageSource.getMessage("my.apps." + k, new Object[]{}, locale)));
    }

    @RequestMapping(method = RequestMethod.GET)
    public String show() {
        return "appmanagement/myapps";
    }

//    @RequestMapping(method = RequestMethod.GET, value ={"","/"})
//    public String show(Model model, @RequestParam(value = "defaultAuthorityId", required = false, defaultValue = "") String defaultAuthorityId) {
//        model.addAttribute("authorities", networkService.getMyAuthorities(true));
//        model.addAttribute("defaultAuthorityId", defaultAuthorityId);
//        model.addAttribute("pending", appManagementService.getPendingInstances());
//
//        return "appsmanagement/appsmanagement";
//    }
//
//
//
//    @RequestMapping(method=RequestMethod.POST, value="/service-settings/{service_id}")
//    public String saveServiceSettings(Model model, @PathVariable("service_id") String serviceId, @ModelAttribute CatalogEntry service) {
//
//        CatalogEntry entry = appManagementService.updateService(serviceId, service);
//        return "redirect:/my/appsmanagement?defaultAuthorityId=" + entry.getProviderId();
//    }
}
