package org.oasis_eu.portal.front.my;

import java.beans.PropertyEditorSupport;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import javax.validation.Valid;

import org.oasis_eu.portal.core.controller.Languages;
import org.oasis_eu.portal.front.generic.PortalController;
import org.oasis_eu.portal.model.FormLayout;
import org.oasis_eu.portal.model.FormLayoutMode;
import org.oasis_eu.portal.model.FormWidgetDropdown;
import org.oasis_eu.portal.services.MyNavigationService;
import org.oasis_eu.spring.kernel.model.Address;
import org.oasis_eu.spring.kernel.model.UserAccount;
import org.oasis_eu.spring.kernel.model.UserInfo;
import org.oasis_eu.spring.kernel.service.UserAccountService;
import org.oasis_eu.spring.kernel.service.UserInfoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * 
 * @author mkalamalami
 *
 */
@Controller
@RequestMapping("/my/profile")
public class MyProfileController extends PortalController {

	@SuppressWarnings("unused")
	private static final Logger logger = LoggerFactory
			.getLogger(MyProfileController.class);

	@Autowired
	private MyNavigationService myNavigationService;

	@Autowired(required = false)
	private MyProfileState myProfileState;

	@Autowired
	private UserInfoService userInfoService;
	
	@Autowired
	private UserAccountService userAccountService;
	
	@ModelAttribute("modelObject")
	UserAccount getCurrentUserAccount() {
		
		return new UserAccount(userInfoService.currentUser());
	}
	
	@InitBinder
	protected void initBinder(WebDataBinder binder){
		
		binder.registerCustomEditor(LocalDate.class, new PropertyEditorSupport() {

            public void setAsText(String value) {
                try {
                    //DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ISO_LOCAL_DATE.withLocale(new Locale(currentLanguage().getLanguage())); // Languages.locale renvoie en pour locale en-GB
                    //setValue(LocalDate.parse(value, dateTimeFormatter));
                    setValue(LocalDate.parse(value));
                } catch (DateTimeParseException e) {

                    setValue(null);
                }
            }

            public String getAsText() {
                return getValue() != null ? getValue().toString() : "1970-01-01";
            }

        });
	}

	@RequestMapping(method = RequestMethod.GET, value = "")
	public String profile(@ModelAttribute("modelObject") UserAccount currentUser, Model model) {
		initProfileModel(model);
		return "my-profile";
	}

	@RequestMapping(method = RequestMethod.GET, value = "/fragment/layout/{id}")
	public String profileLayoutFragment(@PathVariable("id") String layoutId,
			Model model) {
		
		initProfileModel(model);
		model.addAttribute("layout", myProfileState.getLayout(layoutId));
		
		return "includes/my-profile-fragments :: layout";
	}

	@RequestMapping(method = RequestMethod.POST, value = "/mode")
	public String toggleProfileLayout(@RequestParam("mode") String mode,
			@RequestParam("id") String layoutId, Model model) {
		FormLayout formLayout = myProfileState.getLayout(layoutId);
		if (formLayout != null) {
			formLayout.setMode(FormLayoutMode.valueOf(mode));
		}
		initProfileModel(model);
		model.addAttribute("layout", formLayout);

		return "redirect:/my/profile/fragment/layout/" + layoutId;
	}

	@RequestMapping(method = RequestMethod.POST, value = "/save/{layoutId}")
	public String saveLayout(@PathVariable("layoutId") String layoutId,
			@ModelAttribute("modelObject") @Valid UserAccount currentUser, BindingResult result, Model model) {

		if(result.hasErrors()) {
			
			//return "my-profile";
			initProfileModel(model);
			model.addAttribute("layout", myProfileState.getLayout(layoutId));
			return "includes/my-profile-fragments :: layout";
		}
		userAccountService.saveUserAccount(currentUser);

		myProfileState.getLayout(layoutId).setMode(FormLayoutMode.VIEW);
		return "redirect:/my/profile/fragment/layout/" + layoutId;
	}

	protected void initProfileModel(Model model) {
		model.addAttribute("navigation",
				myNavigationService.getNavigation("profile"));
		model.addAttribute("layouts", myProfileState.getLayouts());
		
		FormWidgetDropdown localeDropDown = (FormWidgetDropdown) myProfileState.getLayout("account").getWidget("locale");
		for(Languages language : languages()) {
			localeDropDown.addOption(language.getLocale().getLanguage(), "language.name."+language.getLocale().getLanguage());
		}
		
	    if (user().getLocale() != null) {
			    model.addAttribute("userLanguage", Languages.getByLocale(Locale.forLanguageTag(
					    user().getLocale()), Languages.ENGLISH));
	    } else {
	        model.addAttribute("userLanguage", Languages.ENGLISH);
	    }
	}

};
